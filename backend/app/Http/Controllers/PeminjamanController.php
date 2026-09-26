<?php

namespace App\Http\Controllers;

use App\Mail\PeminjamanStatusMail;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Peminjaman;
use App\Models\Room;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

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
    public function storeUser(Request $request): JsonResponse
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

        // Check for room schedule conflict (same room, same date, overlapping time, status != ditolak)
        $conflict = Peminjaman::where('room_id', $validated['room_id'])
            ->where('tanggal', $validated['tanggal'])
            ->whereIn('status', ['menunggu', 'disetujui'])
            ->where(function ($query) use ($validated) {
                $query->where('jam_mulai', '<', $validated['jam_selesai'])
                      ->where('jam_selesai', '>', $validated['jam_mulai']);
            })
            ->first();

        if ($conflict) {
            $room = Room::find($validated['room_id']);
            $roomName = $room ? $room->name : 'Ruangan ini';
            $statusText = $conflict->status === 'disetujui' ? 'telah disetujui untuk' : 'sedang diajukan untuk';
            return response()->json([
                'status' => 'error',
                'message' => "Jadwal bentrok: {$roomName} {$statusText} kegiatan \"{$conflict->nama_kegiatan}\" pada tanggal {$validated['tanggal']} pukul {$conflict->jam_mulai} - {$conflict->jam_selesai}. Silakan pilih jam atau ruangan lain.",
            ], 422);
        }

        // Handle file attachment (PDF or Word)
        if ($request->hasFile('berkas')) {
            $file = $request->file('berkas');
            $path = $file->store('berkas_peminjaman', 'public');
            $validated['berkas_path'] = $path;
            $validated['berkas_url'] = url('storage/' . $path);
            $validated['berkas_name'] = $file->getClientOriginalName();
        }

        // Generate unique ticket number
        $year = date('Y');
        do {
            $ticketNumber = '#RNG-' . $year . '-' . mt_rand(1000, 9999);
        } while (Peminjaman::where('ticket_number', $ticketNumber)->exists());

        $validated['ticket_number'] = $ticketNumber;
        $validated['user_id'] = $user->id;
        $validated['status'] = 'menunggu';

        $peminjaman = Peminjaman::create($validated);
        $peminjaman->load('room');

        // Increment room peminjaman_count
        Room::where('id', $validated['room_id'])->increment('peminjaman_count');

        // Notify user that their application was received
        Notification::create([
            'user_id'       => $user->id,
            'title'         => 'Pengajuan Diterima',
            'body'          => "Pengajuan \"{$peminjaman->nama_kegiatan}\" ({$ticketNumber}) berhasil dikirim dan sedang menunggu verifikasi admin.",
            'type'          => 'info',
            'peminjaman_id' => $peminjaman->id,
        ]);

        // Log activity for Admin
        ActivityLog::create([
            'admin_id'     => null,
            'action'       => 'pengajuan_baru',
            'description'  => "Penyewa {$user->name} mengajukan peminjaman {$ticketNumber}: {$peminjaman->nama_kegiatan}",
            'subject_type' => 'Peminjaman',
            'subject_id'   => $peminjaman->id,
            'meta'         => [
                'ticket_number' => $ticketNumber,
                'user_name'     => $user->name,
                'room_name'     => $peminjaman->room?->name,
            ],
        ]);

        self::flushPeminjamanCache();

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
            'admin_id'     => null,
            'action'       => 'cancel',
            'description'  => "User membatalkan pengajuan {$peminjaman->ticket_number}: {$peminjaman->nama_kegiatan}",
            'subject_type' => 'Peminjaman',
            'subject_id'   => $peminjaman->id,
            'meta'         => ['ticket_number' => $peminjaman->ticket_number],
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengajuan berhasil dibatalkan.',
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
        $cacheKey = "peminjaman_admin_list_v{$v}_{$status}_" . md5($search);

        $peminjamans = Cache::remember($cacheKey, 120, function () use ($status, $search) {
            $query = Peminjaman::with(['user', 'room'])->orderBy('id', 'desc');

            if (in_array($status, ['menunggu', 'disetujui', 'ditolak'])) {
                $query->where('status', $status);
            }

            if (!empty($search)) {
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
        $peminjaman->status = $validated['status'];

        if ($validated['status'] === 'ditolak') {
            $peminjaman->reject_note = $validated['reject_note'] ?? 'Pengajuan ditolak oleh administrator.';
        } else {
            $peminjaman->reject_note = null;
        }

        $peminjaman->save();

        // Create in-app notification for the applicant
        if ($peminjaman->user_id) {
            $statusLabel = $peminjaman->status === 'disetujui' ? 'disetujui ✅' : 'ditolak ❌';
            $body = $peminjaman->status === 'disetujui'
                ? "Selamat! Pengajuan \"{$peminjaman->nama_kegiatan}\" ({$peminjaman->ticket_number}) telah disetujui."
                : "Pengajuan \"{$peminjaman->nama_kegiatan}\" ({$peminjaman->ticket_number}) ditolak. Alasan: " . ($peminjaman->reject_note ?? '-');

            Notification::create([
                'user_id'       => $peminjaman->user_id,
                'title'         => 'Status Pengajuan ' . ucfirst($statusLabel),
                'body'          => $body,
                'type'          => $peminjaman->status === 'disetujui' ? 'success' : 'error',
                'peminjaman_id' => $peminjaman->id,
            ]);

            // Send email notification
            if ($peminjaman->user?->email) {
                try {
                    Mail::to($peminjaman->user->email)->send(new PeminjamanStatusMail($peminjaman));
                } catch (\Throwable $e) {
                    // Log but don't fail the request
                    \Log::warning('Failed to send status email: ' . $e->getMessage());
                }
            }
        }

        // Log admin activity
        $adminId = $request->user()?->id;
        ActivityLog::create([
            'admin_id'     => $adminId,
            'action'       => $peminjaman->status,
            'description'  => "Admin mengubah status pengajuan {$peminjaman->ticket_number} dari {$oldStatus} menjadi {$peminjaman->status}.",
            'subject_type' => 'Peminjaman',
            'subject_id'   => $peminjaman->id,
            'meta'         => [
                'ticket_number'  => $peminjaman->ticket_number,
                'nama_kegiatan'  => $peminjaman->nama_kegiatan,
                'room'           => $peminjaman->room?->name,
                'reject_note'    => $peminjaman->reject_note,
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

            // Room usage calculation
            $rooms = Room::withCount(['peminjamans as approved_bookings' => function ($q) {
                $q->where('status', 'disetujui');
            }])->get();

            $maxBookings = max(1, $rooms->max('approved_bookings'));
            $roomUsage = $rooms->map(function ($r) use ($maxBookings) {
                $usagePercent = min(100, (int) round(($r->approved_bookings / $maxBookings) * 85 + 15));
                if ($r->approved_bookings === 0) {
                    $usagePercent = 10;
                }
                return [
                    'name' => $r->name,
                    'bookings' => $r->approved_bookings,
                    'usage' => $usagePercent,
                    'status' => $r->status,
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
    public function exportAdmin(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $query = Peminjaman::with(['user', 'room'])->orderBy('id', 'desc');

        if ($request->filled('status') && in_array($request->input('status'), ['menunggu', 'disetujui', 'ditolak'])) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('bulan')) {
            $query->whereRaw("to_char(tanggal, 'YYYY-MM') = ?", [$request->input('bulan')]);
        }

        $peminjamans = $query->get();

        $filename = 'laporan_peminjaman_' . now()->format('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($peminjamans) {
            $handle = fopen('php://output', 'w');

            // BOM for Excel UTF-8
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Header row
            fputcsv($handle, [
                'No. Tiket', 'Nama Kegiatan', 'Organisasi', 'Pemohon', 'NIM',
                'Ruangan', 'Tanggal', 'Jam Mulai', 'Jam Selesai',
                'Estimasi Peserta', 'Status', 'Alasan Penolakan', 'Tanggal Pengajuan',
            ]);

            foreach ($peminjamans as $p) {
                fputcsv($handle, [
                    $p->ticket_number,
                    $p->nama_kegiatan,
                    $p->organisasi,
                    $p->user?->name ?? '-',
                    $p->user?->nim ?? '-',
                    $p->room?->name ?? '-',
                    $p->tanggal,
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
}
