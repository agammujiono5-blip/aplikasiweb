<?php

namespace App\Http\Controllers;

use App\Mail\PeminjamanStatusMail;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Peminjaman;
use App\Models\Room;
use App\Models\User;
use App\Services\N8nService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PeminjamanController extends Controller
{
    /**
     * Atomically bump cache version for all peminjaman lists, stats, and schedules.
     */
    public static function flushPeminjamanCache(): void
    {
        $v = (int) Cache::get('peminjaman_v', 1);
        Cache::put('peminjaman_v', $v + 1, 86400 * 30);
        Cache::forget('rooms_list_with_count');

        // Daftar pengguna memuat jumlah pengajuan, jadi harus ikut dihapus.
        Cache::forget(UserController::USERS_CACHE_KEY);
    }

    /**
     * Normalize a free-text time value ("8", "8.00", "08.00 WIB", "08:00:00") into "HH:MM".
     * Returns null when the value cannot be parsed as a valid time.
     */
    public static function normalizeTime(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $clean = strtoupper(trim($value));
        $clean = preg_replace('/\s*(WIB|UTC|GMT)\s*/', '', $clean) ?? $clean;

        if (! preg_match('/^(\d{1,2})\s*[:.]\s*(\d{1,2})/', $clean, $matches)) {
            return null;
        }

        $hour = (int) $matches[1];
        $minute = (int) $matches[2];

        if ($hour > 23 || $minute > 59) {
            return null;
        }

        return sprintf('%02d:%02d', $hour, $minute);
    }

    /**
     * Validate that jam_mulai is earlier than jam_selesai.
     */
    public static function hasValidTimeRange(string $start, string $end): bool
    {
        return $start < $end;
    }

    /**
     * Find an overlapping peminjaman for the given room, date and time range.
     * Times are normalized so "8.00" and "08:00" are compared correctly.
     * Rejected applications are ignored (same behaviour as the manual query it replaces).
     */
    public static function findScheduleConflict(
        int $roomId,
        ?string $tanggal,
        string $jamMulai,
        string $jamSelesai,
        ?int $excludeId = null
    ): ?Peminjaman {
        if (! $tanggal) {
            return null;
        }

        $date = Carbon::parse($tanggal)->format('Y-m-d');

        return Peminjaman::where('room_id', $roomId)
            ->whereIn('status', ['menunggu', 'disetujui'])
            ->where(fn ($query) => $query->whereDate('tanggal', $date))
            ->when($excludeId !== null, fn ($query) => $query->where('id', '!=', $excludeId))
            ->get(['id', 'ticket_number', 'room_id', 'nama_kegiatan', 'status', 'tanggal', 'jam_mulai', 'jam_selesai'])
            ->first(fn (Peminjaman $item) => static::isOverlapping(
                $jamMulai,
                $jamSelesai,
                static::normalizeTime($item->jam_mulai),
                static::normalizeTime($item->jam_selesai)
            ));
    }

    /**
     * Half-open interval overlap check: [start A, end A) vs [start B, end B).
     * 08:00-12:00 and 12:00-14:00 do NOT overlap; 08:00-12:00 and 10:00-14:00 DO overlap.
     */
    public static function isOverlapping(string $startA, string $endA, ?string $startB, ?string $endB): bool
    {
        if ($startB === null || $endB === null) {
            return false;
        }

        return $startA < $endB && $endA > $startB;
    }

    /**
     * Format the user-facing conflict message.
     */
    public static function conflictMessage(Peminjaman $conflict, ?int $roomId, string $tanggal): string
    {
        $room = Room::find($roomId);
        $roomName = $room ? $room->name : 'Ruangan ini';
        $statusText = $conflict->status === 'disetujui' ? 'telah disetujui untuk' : 'sedang diajukan untuk';
        $tanggalText = Carbon::parse($tanggal)->format('Y-m-d');

        return "Jadwal bentrok: {$roomName} {$statusText} kegiatan \"{$conflict->nama_kegiatan}\" pada tanggal {$tanggalText} pukul {$conflict->jam_mulai} - {$conflict->jam_selesai}. Silakan pilih jam atau ruangan lain.";
    }

    /**
     * Run a booking write inside a transaction with a row-level lock on the room.
     * The lock serializes concurrent submissions for the same room so the conflict
     * check cannot be bypassed by two requests racing each other.
     */
    protected static function withRoomLock(int $roomId, callable $callback): mixed
    {
        return DB::transaction(function () use ($roomId, $callback) {
            Room::whereKey($roomId)->lockForUpdate()->first();

            return $callback();
        });
    }

    /**
     * Get loan history of the authenticated user (Penyewa).
     */
    public function indexUser(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $v = Cache::get('peminjaman_v', 1);

        $peminjamans = Cache::remember("peminjaman_user_list_v{$v}_{$userId}", 120, function () use ($userId) {
            return Peminjaman::with('room')
                ->where('user_id', $userId)
                ->orderBy('id', 'desc')
                ->get()
                ->toArray();
        });

        return response()->json([
            'status' => 'success',
            'data' => $peminjamans,
        ]);
    }

    /**
     * Submit a new loan application by Penyewa.
     */
    public function storeUser(Request $request, N8nService $n8n): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'nama_kegiatan' => 'required|string|max:255',
            'organisasi' => 'required|string|max:255',
            'jenis_kegiatan' => 'nullable|string|max:255',
            'room_id' => 'required|exists:rooms,id',
            'tanggal' => 'required|date',
            'jam_mulai' => 'required|string|max:10',
            'jam_selesai' => 'required|string|max:10',
            'estimasi_peserta' => 'required|integer|min:1',
            'keperluan' => 'nullable|string',
            'fasilitas' => 'nullable',
            'catatan' => 'nullable|string',
            'berkas' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
        ]);

        if (isset($validated['fasilitas'])) {
            if (is_string($validated['fasilitas'])) {
                $decoded = json_decode($validated['fasilitas'], true);
                $validated['fasilitas'] = is_array($decoded) ? $decoded : [];
            }
        } else {
            $validated['fasilitas'] = [];
        }

        // Normalize the requested time range before any comparison
        $jamMulai = static::normalizeTime($validated['jam_mulai']);
        $jamSelesai = static::normalizeTime($validated['jam_selesai']);

        if ($jamMulai === null || $jamSelesai === null) {
            return response()->json([
                'status' => 'error',
                'message' => 'Format jam tidak valid. Gunakan format HH:MM, contoh 08:00.',
            ], 422);
        }

        if (! static::hasValidTimeRange($jamMulai, $jamSelesai)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Jam selesai harus lebih akhir dari jam mulai.',
            ], 422);
        }

        $validated['jam_mulai'] = $jamMulai;
        $validated['jam_selesai'] = $jamSelesai;
        $validated['tanggal'] = Carbon::parse($validated['tanggal'])->format('Y-m-d');

        // Store the attachment before the transaction so a slow upload never holds the room lock
        if ($request->hasFile('berkas')) {
            $file = $request->file('berkas');
            $path = $file->store('berkas_peminjaman', 'public');
            $validated['berkas_path'] = $path;
            $validated['berkas_url'] = url('storage/'.$path);
            $validated['berkas_name'] = $file->getClientOriginalName();
        }

        $conflictResult = null;

        $peminjaman = static::withRoomLock((int) $validated['room_id'], function () use ($validated, $user, &$conflictResult) {
            // Check for room schedule conflict (same room, same date, overlapping time)
            $conflict = static::findScheduleConflict(
                (int) $validated['room_id'],
                $validated['tanggal'],
                $validated['jam_mulai'],
                $validated['jam_selesai']
            );

            if ($conflict) {
                $conflictResult = $conflict;

                return null;
            }

            // Generate unique ticket number
            $year = Carbon::parse($validated['tanggal'])->format('Y');
            do {
                $ticketNumber = '#RNG-'.$year.'-'.mt_rand(1000, 9999);
            } while (Peminjaman::where('ticket_number', $ticketNumber)->exists());

            $validated['ticket_number'] = $ticketNumber;
            $validated['user_id'] = $user->id;
            $validated['status'] = 'menunggu';

            $peminjaman = Peminjaman::create($validated);

            // Increment room peminjaman_count
            Room::where('id', $validated['room_id'])->increment('peminjaman_count');

            return $peminjaman;
        });

        if ($conflictResult) {
            return response()->json([
                'status' => 'error',
                'message' => static::conflictMessage($conflictResult, (int) $validated['room_id'], $validated['tanggal']),
            ], 422);
        }

        if (! $peminjaman) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengajuan gagal disimpan. Silakan coba lagi.',
            ], 422);
        }

        $ticketNumber = $peminjaman->ticket_number;
        $peminjaman->load('room');

        // Notify user that their application was received
        Notification::create([
            'user_id' => $user->id,
            'title' => 'Pengajuan Diterima',
            'body' => "Pengajuan \"{$peminjaman->nama_kegiatan}\" ({$ticketNumber}) berhasil dikirim dan sedang menunggu verifikasi admin.",
            'type' => 'info',
            'peminjaman_id' => $peminjaman->id,
        ]);

        // Log activity for Admin
        ActivityLog::create([
            'admin_id' => null,
            'action' => 'pengajuan_baru',
            'description' => "Penyewa {$user->name} mengajukan peminjaman {$ticketNumber}: {$peminjaman->nama_kegiatan}",
            'subject_type' => 'Peminjaman',
            'subject_id' => $peminjaman->id,
            'meta' => [
                'ticket_number' => $ticketNumber,
                'user_name' => $user->name,
                'room_name' => $peminjaman->room?->name,
            ],
        ]);

        self::flushPeminjamanCache();
        // Send new loan application to n8n
        $n8n->sendPeminjaman([
            'event' => 'peminjaman.created',
            'ticket_number' => $peminjaman->ticket_number,
            'nama_kegiatan' => $peminjaman->nama_kegiatan,
            'organisasi' => $peminjaman->organisasi,
            'nama_pemohon' => $user->name,
            'nim' => $user->nim,
            'email' => $user->email,
            'ruangan' => $peminjaman->room?->name,
            'tanggal' => $peminjaman->tanggal,
            'jam_mulai' => $peminjaman->jam_mulai,
            'jam_selesai' => $peminjaman->jam_selesai,
            'estimasi_peserta' => $peminjaman->estimasi_peserta,
            'status' => $peminjaman->status,
            'keperluan' => $peminjaman->keperluan,
            'created_at' => $peminjaman->created_at?->toISOString(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengajuan peminjaman berhasil dikirim. Menunggu verifikasi admin.',
            'data' => $peminjaman,
        ], 201);
    }

    /**
     * Cancel an application by the applicant user (if still 'menunggu').
     */
    public function cancelUser(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $peminjaman = Peminjaman::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($peminjaman->status !== 'menunggu') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengajuan yang sudah diproses tidak dapat dibatalkan.',
            ], 422);
        }

        $peminjaman->status = 'ditolak';
        $peminjaman->reject_note = 'Dibatalkan oleh pemohon.';
        $peminjaman->save();

        self::flushPeminjamanCache();

        // Log activity
        ActivityLog::create([
            'admin_id' => null,
            'action' => 'cancel',
            'description' => "User membatalkan pengajuan {$peminjaman->ticket_number}: {$peminjaman->nama_kegiatan}",
            'subject_type' => 'Peminjaman',
            'subject_id' => $peminjaman->id,
            'meta' => ['ticket_number' => $peminjaman->ticket_number],
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengajuan berhasil dibatalkan.',
            'data' => $peminjaman,
        ]);
    }

    /**
     * Update an existing loan application by Penyewa (only if status is 'menunggu').
     */
    public function updateUser(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $peminjaman = Peminjaman::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($peminjaman->status !== 'menunggu') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengajuan yang sudah diproses tidak dapat diubah.',
            ], 422);
        }

        $validated = $request->validate([
            'nama_kegiatan' => 'required|string|max:255',
            'organisasi' => 'required|string|max:255',
            'jenis_kegiatan' => 'nullable|string|max:255',
            'room_id' => 'required|exists:rooms,id',
            'tanggal' => 'required|date',
            'jam_mulai' => 'required|string|max:10',
            'jam_selesai' => 'required|string|max:10',
            'estimasi_peserta' => 'required|integer|min:1',
            'keperluan' => 'nullable|string',
            'fasilitas' => 'nullable',
            'catatan' => 'nullable|string',
            'berkas' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
        ]);

        if (isset($validated['fasilitas'])) {
            if (is_string($validated['fasilitas'])) {
                $decoded = json_decode($validated['fasilitas'], true);
                $validated['fasilitas'] = is_array($decoded) ? $decoded : [];
            }
        } else {
            $validated['fasilitas'] = $peminjaman->fasilitas ?? [];
        }

        // Normalize the requested time range before any comparison
        $jamMulai = static::normalizeTime($validated['jam_mulai']);
        $jamSelesai = static::normalizeTime($validated['jam_selesai']);

        if ($jamMulai === null || $jamSelesai === null) {
            return response()->json([
                'status' => 'error',
                'message' => 'Format jam tidak valid. Gunakan format HH:MM, contoh 08:00.',
            ], 422);
        }

        if (! static::hasValidTimeRange($jamMulai, $jamSelesai)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Jam selesai harus lebih akhir dari jam mulai.',
            ], 422);
        }

        $validated['jam_mulai'] = $jamMulai;
        $validated['jam_selesai'] = $jamSelesai;
        $validated['tanggal'] = Carbon::parse($validated['tanggal'])->format('Y-m-d');

        // Handle file attachment update
        if ($request->hasFile('berkas')) {
            $file = $request->file('berkas');
            $path = $file->store('berkas_peminjaman', 'public');
            $validated['berkas_path'] = $path;
            $validated['berkas_url'] = url('storage/'.$path);
            $validated['berkas_name'] = $file->getClientOriginalName();
        }

        $conflictResult = null;

        static::withRoomLock((int) $validated['room_id'], function () use ($peminjaman, $validated, &$conflictResult) {
            // Guard against the application being processed while this request waited for the lock
            $peminjaman->refresh();

            if ($peminjaman->status !== 'menunggu') {
                $conflictResult = 'processed';

                return;
            }

            // Check for room schedule conflict, excluding the current peminjaman
            $conflict = static::findScheduleConflict(
                (int) $validated['room_id'],
                $validated['tanggal'],
                $validated['jam_mulai'],
                $validated['jam_selesai'],
                $peminjaman->id
            );

            if ($conflict) {
                $conflictResult = $conflict;

                return;
            }

            // Update room_id change: adjust peminjaman_count
            if ($peminjaman->room_id != $validated['room_id']) {
                Room::where('id', $peminjaman->room_id)->decrement('peminjaman_count');
                Room::where('id', $validated['room_id'])->increment('peminjaman_count');
            }

            $peminjaman->update($validated);
        });

        if ($conflictResult === 'processed') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengajuan yang sudah diproses tidak dapat diubah.',
            ], 422);
        }

        if ($conflictResult instanceof Peminjaman) {
            return response()->json([
                'status' => 'error',
                'message' => static::conflictMessage($conflictResult, (int) $validated['room_id'], $validated['tanggal']),
            ], 422);
        }

        $peminjaman->load('room');

        // Log activity
        ActivityLog::create([
            'admin_id' => null,
            'action' => 'update_pengajuan',
            'description' => "Penyewa {$user->name} mengubah data pengajuan {$peminjaman->ticket_number}: {$peminjaman->nama_kegiatan}",
            'subject_type' => 'Peminjaman',
            'subject_id' => $peminjaman->id,
            'meta' => [
                'ticket_number' => $peminjaman->ticket_number,
                'user_name' => $user->name,
                'room_name' => $peminjaman->room?->name,
            ],
        ]);

        self::flushPeminjamanCache();

        return response()->json([
            'status' => 'success',
            'message' => 'Data pengajuan peminjaman berhasil diperbarui.',
            'data' => $peminjaman,
        ]);
    }

    /**
     * Live stats for Penyewa dashboard.
     * High-speed versioned cache for zero-delay response.
     */
    public function statsUser(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $v = Cache::get('peminjaman_v', 1);

        $stats = Cache::remember("peminjaman_user_stats_v{$v}_{$userId}", 120, function () use ($userId) {
            $counts = Peminjaman::where('user_id', $userId)
                ->selectRaw("
                    count(*) as total,
                    count(case when status = 'disetujui' then 1 end) as disetujui,
                    count(case when status = 'menunggu' then 1 end) as menunggu,
                    count(case when status = 'ditolak' then 1 end) as ditolak
                ")->first();

            $recent = Peminjaman::with('room')
                ->where('user_id', $userId)
                ->orderBy('id', 'desc')
                ->limit(5)
                ->get()
                ->toArray();

            return [
                'total' => (int) ($counts->total ?? 0),
                'disetujui' => (int) ($counts->disetujui ?? 0),
                'menunggu' => (int) ($counts->menunggu ?? 0),
                'ditolak' => (int) ($counts->ditolak ?? 0),
                'recent' => $recent,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $stats,
        ]);
    }

    /**
     * Get all applications for Admin with optional status and search filter.
     * High-speed versioned cache for zero-delay responses.
     */
    public function indexAdmin(Request $request): JsonResponse
    {
        $status = $request->input('status', 'all');
        $search = trim((string) $request->input('search', ''));
        $v = Cache::get('peminjaman_v', 1);
        $cacheKey = "peminjaman_admin_list_v{$v}_{$status}_".md5($search);

        $peminjamans = Cache::remember($cacheKey, 120, function () use ($status, $search) {
            $query = Peminjaman::with(['user', 'room'])->orderBy('id', 'desc');

            if (in_array($status, ['menunggu', 'disetujui', 'ditolak'])) {
                $query->where('status', $status);
            }

            if (! empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('nama_kegiatan', 'like', "%{$search}%")
                        ->orWhere('ticket_number', 'like', "%{$search}%")
                        ->orWhere('organisasi', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($uq) use ($search) {
                            $uq->where('name', 'like', "%{$search}%")
                                ->orWhere('nim', 'like', "%{$search}%");
                        })
                        ->orWhereHas('room', function ($rq) use ($search) {
                            $rq->where('name', 'like', "%{$search}%");
                        });
                });
            }

            return $query->get()->toArray();
        });

        return response()->json([
            'status' => 'success',
            'data' => $peminjamans,
        ]);
    }

    /**
     * Approve or reject an application (Admin only).
     */
    public function updateStatusAdmin(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:disetujui,ditolak',
            'reject_note' => 'nullable|string',
        ]);

        $peminjaman = Peminjaman::with(['user', 'room'])->findOrFail($id);
        $oldStatus = $peminjaman->status;

        $approvalConflict = null;

        static::withRoomLock((int) $peminjaman->room_id, function () use ($peminjaman, $validated, &$approvalConflict) {
            // Approving must re-check the schedule so a room can never end up with two approved bookings
            if ($validated['status'] === 'disetujui') {
                $approvalConflict = static::findScheduleConflict(
                    (int) $peminjaman->room_id,
                    $peminjaman->tanggal?->format('Y-m-d') ?? (string) $peminjaman->tanggal,
                    static::normalizeTime($peminjaman->jam_mulai) ?? '00:00',
                    static::normalizeTime($peminjaman->jam_selesai) ?? '00:00',
                    $peminjaman->id
                );

                if ($approvalConflict) {
                    return;
                }
            }

            $peminjaman->status = $validated['status'];

            if ($validated['status'] === 'ditolak') {
                $peminjaman->reject_note = $validated['reject_note'] ?? 'Pengajuan ditolak oleh administrator.';
            } else {
                $peminjaman->reject_note = null;
            }

            $peminjaman->save();
        });

        if ($approvalConflict) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak dapat menyetujui: '.static::conflictMessage(
                    $approvalConflict,
                    (int) $peminjaman->room_id,
                    $peminjaman->tanggal?->format('Y-m-d') ?? (string) $peminjaman->tanggal
                ),
            ], 422);
        }

        // Create in-app notification for the applicant
        if ($peminjaman->user_id) {
            $statusLabel = $peminjaman->status === 'disetujui' ? 'disetujui ✅' : 'ditolak ❌';
            $body = $peminjaman->status === 'disetujui'
                ? "Selamat! Pengajuan \"{$peminjaman->nama_kegiatan}\" ({$peminjaman->ticket_number}) telah disetujui."
                : "Pengajuan \"{$peminjaman->nama_kegiatan}\" ({$peminjaman->ticket_number}) ditolak. Alasan: ".($peminjaman->reject_note ?? '-');

            Notification::create([
                'user_id' => $peminjaman->user_id,
                'title' => 'Status Pengajuan '.ucfirst($statusLabel),
                'body' => $body,
                'type' => $peminjaman->status === 'disetujui' ? 'success' : 'error',
                'peminjaman_id' => $peminjaman->id,
            ]);

            // Send email notification
            if ($peminjaman->user?->email) {
                try {
                    Mail::to($peminjaman->user->email)->send(new PeminjamanStatusMail($peminjaman));
                } catch (\Throwable $e) {
                    // Log but don't fail the request
                    \Log::warning('Failed to send status email: '.$e->getMessage());
                }
            }
        }

        // Log admin activity
        $adminId = $request->user()?->id;
        ActivityLog::create([
            'admin_id' => $adminId,
            'action' => $peminjaman->status,
            'description' => "Admin mengubah status pengajuan {$peminjaman->ticket_number} dari {$oldStatus} menjadi {$peminjaman->status}.",
            'subject_type' => 'Peminjaman',
            'subject_id' => $peminjaman->id,
            'meta' => [
                'ticket_number' => $peminjaman->ticket_number,
                'nama_kegiatan' => $peminjaman->nama_kegiatan,
                'room' => $peminjaman->room?->name,
                'reject_note' => $peminjaman->reject_note,
            ],
        ]);

        // Invalidate all peminjaman and room caches so counts and statuses are fresh
        self::flushPeminjamanCache();

        return response()->json([
            'status' => 'success',
            'message' => "Pengajuan {$peminjaman->ticket_number} berhasil diubah statusnya menjadi {$peminjaman->status}.",
            'data' => $peminjaman,
        ]);
    }

    /**
     * Live stats for Admin Beranda.
     * High-speed versioned cache for zero-delay response.
     */
    public function statsAdmin(): JsonResponse
    {
        $v = Cache::get('peminjaman_v', 1);

        $data = Cache::remember("peminjaman_admin_stats_v{$v}", 120, function () {
            $counts = Peminjaman::selectRaw("
                count(*) as total,
                count(case when status = 'menunggu' then 1 end) as menunggu,
                count(case when status = 'disetujui' then 1 end) as disetujui,
                count(case when status = 'ditolak' then 1 end) as ditolak
            ")->first();

            $total = (int) ($counts->total ?? 0);
            $menunggu = (int) ($counts->menunggu ?? 0);
            $disetujui = (int) ($counts->disetujui ?? 0);
            $ditolak = (int) ($counts->ditolak ?? 0);

            // Pending items with waiting days calculation (ordered by id DESC so newest pending items appear at the TOP)
            $pendingItems = Peminjaman::with(['user', 'room'])
                ->where('status', 'menunggu')
                ->orderBy('id', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($item) {
                    $days = $item->created_at ? max(0, (int) abs(Carbon::now()->diffInDays($item->created_at))) : 0;

                    return [
                        'id' => $item->ticket_number,
                        'db_id' => $item->id,
                        'title' => $item->nama_kegiatan,
                        'room' => $item->room ? $item->room->name : '-',
                        'date' => $item->tanggal ? Carbon::parse($item->tanggal)->translatedFormat('d M Y') : '-',
                        'raw_date' => $item->tanggal,
                        'requester' => $item->user ? $item->user->name : '-',
                        'org' => $item->organisasi,
                        'days' => $days,
                    ];
                });

            // Room usage calculation — satu query agregat untuk semua ruangan
            // (menghindari subquery count per ruangan pada DB remote).
            $approvedPerRoom = Peminjaman::query()
                ->selectRaw('room_id, count(*) as approved_bookings')
                ->where('status', 'disetujui')
                ->groupBy('room_id')
                ->pluck('approved_bookings', 'room_id');

            // Pakai cache daftar ruangan yang sudah diisi RoomController::index.
            $rooms = collect(Cache::remember('rooms_list_with_count', 120, function () {
                return Room::orderBy('id', 'asc')->get(['id', 'name', 'status', 'gedung', 'kapasitas', 'fasilitas', 'created_at', 'updated_at'])->toArray();
            }));

            $maxBookings = max(1, (int) $approvedPerRoom->max());
            $roomUsage = $rooms->map(function ($r) use ($maxBookings, $approvedPerRoom) {
                $bookings = (int) ($approvedPerRoom[$r['id']] ?? 0);
                $usagePercent = min(100, (int) round(($bookings / $maxBookings) * 85 + 15));
                if ($bookings === 0) {
                    $usagePercent = 10;
                }

                return [
                    'name' => $r['name'],
                    'bookings' => $bookings,
                    'usage' => $usagePercent,
                    'status' => $r['status'],
                ];
            })->sortByDesc('bookings')->values();

            return [
                'total' => $total,
                'menunggu' => $menunggu,
                'disetujui' => $disetujui,
                'ditolak' => $ditolak,
                'pending_items' => $pendingItems->values()->all(),
                'room_usage' => $roomUsage->values()->all(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }

    /**
     * Get calendar schedule events (for JadwalRuangan & AdminJadwal).
     * High-speed versioned cache for zero-delay calendar loading.
     */
    public function getJadwal(Request $request): JsonResponse
    {
        $roomId = $request->input('room_id', 'all');
        $v = Cache::get('peminjaman_v', 1);
        $cacheKey = "jadwal_events_v{$v}_{$roomId}";

        $res = Cache::remember($cacheKey, 120, function () use ($roomId) {
            $query = Peminjaman::with(['room', 'user'])
                ->whereIn('status', ['disetujui', 'menunggu'])
                ->orderBy('tanggal', 'asc')
                ->orderBy('jam_mulai', 'asc');

            if ($roomId !== 'all') {
                $query->where('room_id', $roomId);
            }

            $allPeminjamans = $query->get();

            $eventsByDate = [];
            foreach ($allPeminjamans as $item) {
                $dateKey = Carbon::parse($item->tanggal)->format('Y-m-d');
                if (! isset($eventsByDate[$dateKey])) {
                    $eventsByDate[$dateKey] = [];
                }

                $eventsByDate[$dateKey][] = [
                    'id' => $item->ticket_number,
                    'db_id' => $item->id,
                    'title' => $item->nama_kegiatan,
                    'room' => $item->room ? $item->room->name : '-',
                    'room_id' => $item->room_id,
                    'time' => "{$item->jam_mulai}–{$item->jam_selesai}",
                    'requester' => $item->user ? $item->user->name : $item->organisasi,
                    'org' => $item->organisasi,
                    'status' => $item->status,
                    'peserta' => $item->estimasi_peserta,
                ];
            }

            return [
                'events' => $eventsByDate,
                'raw' => $allPeminjamans->toArray(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $res['events'],
            'raw' => $res['raw'],
        ]);
    }

    /**
     * Export all peminjaman as CSV (Admin only).
     */
    public function exportAdmin(Request $request): StreamedResponse
    {
        $query = Peminjaman::with(['user', 'room'])->orderBy('id', 'desc');

        if ($request->filled('status') && in_array($request->input('status'), ['menunggu', 'disetujui', 'ditolak'])) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('bulan')) {
            $query->whereRaw("to_char(tanggal, 'YYYY-MM') = ?", [$request->input('bulan')]);
        }

        $peminjamans = $query->get();

        $filename = 'laporan_peminjaman_'.now()->format('Ymd_His').'.csv';

        return response()->streamDownload(function () use ($peminjamans) {
            $handle = fopen('php://output', 'w');

            // BOM for Excel UTF-8
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // Header row
            fputcsv($handle, [
                'No. Tiket', 'Nama Kegiatan', 'Organisasi', 'Pemohon', 'NIM',
                'Ruangan', 'Tanggal', 'Jam Mulai', 'Jam Selesai',
                'Estimasi Peserta', 'Status', 'Alasan Penolakan', 'Tanggal Pengajuan',
            ]);

            foreach ($peminjamans as $p) {
                $tgl = $p->tanggal ? Carbon::parse($p->tanggal)->format('Y-m-d') : '-';
                fputcsv($handle, [
                    $p->ticket_number,
                    $p->nama_kegiatan,
                    $p->organisasi,
                    $p->user?->name ?? '-',
                    $p->user?->nim ?? '-',
                    $p->room?->name ?? '-',
                    $tgl,
                    $p->jam_mulai,
                    $p->jam_selesai,
                    $p->estimasi_peserta,
                    strtoupper($p->status),
                    $p->reject_note ?? '',
                    $p->created_at?->format('Y-m-d H:i:s') ?? '',
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Import peminjaman from CSV (Admin only).
     */
    public function importAdmin(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();

        $handle = fopen($path, 'r');
        if (! $handle) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuka dan membaca file CSV.',
            ], 422);
        }

        // Read BOM if present
        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") {
            rewind($handle);
        }

        // Read header
        $header = fgetcsv($handle, 0, ',', '"', '\\');
        if (! $header) {
            fclose($handle);

            return response()->json([
                'status' => 'error',
                'message' => 'File CSV kosong atau tidak memiliki baris header.',
            ], 422);
        }

        $cleanHeader = array_map(function ($h) {
            return strtolower(trim(preg_replace('/[^a-zA-Z0-9_]/', '', str_replace(' ', '_', $h))));
        }, $header);

        $defaultUser = User::first();
        $defaultRoom = Room::first();
        $allRooms = Room::all();
        $allUsers = User::all();

        $imported = 0;
        $errors = [];
        $rowNum = 1;

        while (($row = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
            $rowNum++;
            if (empty(array_filter($row))) {
                continue;
            }

            $data = [];
            foreach ($cleanHeader as $idx => $key) {
                $data[$key] = isset($row[$idx]) ? trim($row[$idx]) : '';
            }

            $namaKegiatan = $data['nama_kegiatan'] ?? $data['kegiatan'] ?? $data['nama'] ?? '';
            if (empty($namaKegiatan)) {
                $errors[] = "Baris {$rowNum}: Kolom Nama Kegiatan tidak boleh kosong.";

                continue;
            }

            $organisasi = $data['organisasi'] ?? $data['instansi'] ?? 'Umum/Mahasiswa';
            $tanggal = $data['tanggal'] ?? $data['date'] ?? date('Y-m-d');
            try {
                $tanggalFormatted = Carbon::parse($tanggal)->format('Y-m-d');
            } catch (\Throwable $e) {
                $tanggalFormatted = date('Y-m-d');
            }

            $jamMulai = $data['jam_mulai'] ?? $data['mulai'] ?? '08:00';
            $jamSelesai = $data['jam_selesai'] ?? $data['selesai'] ?? '12:00';
            $peserta = isset($data['estimasi_peserta']) && is_numeric($data['estimasi_peserta'])
                ? (int) $data['estimasi_peserta']
                : (isset($data['peserta']) && is_numeric($data['peserta']) ? (int) $data['peserta'] : 50);

            $statusRaw = strtolower($data['status'] ?? 'menunggu');
            $status = in_array($statusRaw, ['disetujui', 'ditolak']) ? $statusRaw : 'menunggu';
            $rejectNote = $data['alasan_penolakan'] ?? $data['reject_note'] ?? null;

            // Match Room
            $roomName = $data['ruangan'] ?? $data['ruang'] ?? $data['room'] ?? '';
            $matchedRoom = null;
            if (! empty($roomName)) {
                $matchedRoom = $allRooms->first(function ($r) use ($roomName) {
                    return stripos($r->name, $roomName) !== false || stripos($roomName, $r->name) !== false;
                });
            }
            $roomId = $matchedRoom ? $matchedRoom->id : ($defaultRoom ? $defaultRoom->id : 1);

            // Match User
            $userNim = $data['nim'] ?? '';
            $userName = $data['pemohon'] ?? $data['user'] ?? '';
            $matchedUser = null;
            if (! empty($userNim)) {
                $matchedUser = $allUsers->firstWhere('nim', $userNim);
            }
            if (! $matchedUser && ! empty($userName)) {
                $matchedUser = $allUsers->first(function ($u) use ($userName) {
                    return stripos($u->name, $userName) !== false;
                });
            }
            $userId = $matchedUser ? $matchedUser->id : ($defaultUser ? $defaultUser->id : 1);

            // Ticket number
            $ticket = $data['no_tiket'] ?? $data['ticket_number'] ?? '';
            if (empty($ticket) || Peminjaman::where('ticket_number', $ticket)->exists()) {
                $year = Carbon::parse($tanggalFormatted)->format('Y');
                do {
                    $ticket = '#RNG-'.$year.'-'.mt_rand(1000, 9999);
                } while (Peminjaman::where('ticket_number', $ticket)->exists());
            }

            Peminjaman::create([
                'ticket_number' => $ticket,
                'user_id' => $userId,
                'room_id' => $roomId,
                'nama_kegiatan' => $namaKegiatan,
                'organisasi' => $organisasi,
                'jenis_kegiatan' => $data['jenis_kegiatan'] ?? 'Kegiatan Kampus',
                'tanggal' => $tanggalFormatted,
                'jam_mulai' => $jamMulai,
                'jam_selesai' => $jamSelesai,
                'estimasi_peserta' => $peserta,
                'keperluan' => $data['keperluan'] ?? $namaKegiatan,
                'fasilitas' => ['Proyektor', 'AC'],
                'catatan' => $data['catatan'] ?? 'Diimpor oleh Administrator via CSV',
                'status' => $status,
                'reject_note' => $rejectNote,
            ]);

            $imported++;
        }

        fclose($handle);

        self::flushPeminjamanCache();

        return response()->json([
            'status' => 'success',
            'message' => "Berhasil mengimpor {$imported} data peminjaman dari CSV.",
            'imported_count' => $imported,
            'errors' => $errors,
        ]);
    }

    /**
     * Download sample CSV template for Import.
     */
    public function templateCsv(): StreamedResponse
    {
        $filename = 'template_import_peminjaman_2026.csv';

        return response()->streamDownload(function () {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, [
                'Nama Kegiatan', 'Organisasi', 'NIM', 'Pemohon',
                'Ruangan', 'Tanggal', 'Jam Mulai', 'Jam Selesai',
                'Estimasi Peserta', 'Status', 'Alasan Penolakan',
            ]);

            fputcsv($handle, [
                'Seminar Kecerdasan Buatan dan Big Data 2026',
                'BEM Fasilkom',
                '2021001234',
                'Ahmad Fauzi',
                'Auditorium Rektorat Lt. 3',
                '2026-10-15',
                '08:00',
                '12:30',
                '250',
                'disetujui',
                '',
            ]);

            fputcsv($handle, [
                'Workshop Pengembangan Web Interaktif',
                'Himpunan Mahasiswa Informatika',
                '2022009012',
                'Siti Nurhaliza',
                'Lab Multimedia Fasilkom',
                '2026-10-18',
                '09:00',
                '15:00',
                '40',
                'menunggu',
                '',
            ]);

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
