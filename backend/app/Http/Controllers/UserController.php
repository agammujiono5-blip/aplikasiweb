<?php

namespace App\Http\Controllers;

use App\Models\Peminjaman;
use App\Models\User;
use App\Services\Auth\LoginRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /** Cache daftar pengguna admin (dihapus otomatis saat ada perubahan). */
    public const USERS_CACHE_KEY = 'admin_users_list';

    /**
     * Get all users for DataPengguna (Admin only).
     * High speed cache for zero-delay user table loading.
     */
    public function indexAdmin(): JsonResponse
    {
        $mapped = Cache::remember(self::USERS_CACHE_KEY, 600, function () {
            // Hitung pengajuan & yang disetujui dalam SATU query agregat
            // (bukan dua subquery per user) agar cache-miss tidak menghukum
            // database remote dengan banyak round-trip.
            $counts = Peminjaman::query()
                ->selectRaw('user_id, count(*) as pengajuan_count, count(case when status = \'disetujui\' then 1 end) as approved_count')
                ->groupBy('user_id')
                ->get()
                ->keyBy('user_id');

            $users = User::orderBy('id', 'asc')->get();

            return $users->map(function ($u) use ($counts) {
                $row = $counts->get($u->id);

                return [
                    'id' => (string) $u->id,
                    'nama' => $u->name,
                    'nim' => $u->nim,
                    'email' => $u->email,
                    'prodi' => $u->prodi ?? '-',
                    'fakultas' => $u->fakultas ?? '-',
                    'angkatan' => $u->angkatan ?? '-',
                    'phone' => $u->phone ?? '-',
                    'organisasi' => $u->organisasi ?? '-',
                    'jabatan' => $u->jabatan ?? '-',
                    'alamat' => $u->alamat ?? '-',
                    'status' => $u->is_active ? 'aktif' : 'nonaktif',
                    'pengajuan' => (int) ($row->pengajuan_count ?? 0),
                    'disetujui' => (int) ($row->approved_count ?? 0),
                ];
            })->values()->all();
        });

        return response()->json([
            'status' => 'success',
            'data' => $mapped,
        ]);
    }

    /**
     * Toggle active/inactive user account status (Admin only).
     */
    public function toggleStatusAdmin(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->is_active = ! $user->is_active;
        $user->save();

        Cache::forget(self::USERS_CACHE_KEY);
        LoginRepository::forgetFor($user);

        return response()->json([
            'status' => 'success',
            'message' => 'Status pengguna berhasil diperbarui.',
            'data' => [
                'id' => (string) $user->id,
                'status' => $user->is_active ? 'aktif' : 'nonaktif',
            ],
        ]);
    }

    /**
     * Get profile of currently authenticated user.
     */
    public function getProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $user->id,
                'nama' => $user->name,
                'nim' => $user->nim,
                'email' => $user->email,
                'phone' => $user->phone ?? '',
                'noHp' => $user->phone ?? '',
                'prodi' => $user->prodi ?? '',
                'fakultas' => $user->fakultas ?? '',
                'angkatan' => $user->angkatan ?? '',
                'organisasi' => $user->organisasi ?? '',
                'jabatan' => $user->jabatan ?? '',
                'alamat' => $user->alamat ?? '',
                'bio' => $user->bio ?? '',
                'foto_url' => $user->foto_url ?? '',
                'is_active' => $user->is_active,
            ],
        ]);
    }

    /**
     * Update profile of current user.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'nama' => 'nullable|string|max:255',
            'name' => 'nullable|string|max:255',
            'nim' => 'nullable|string|max:50|unique:users,nim,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'noHp' => 'nullable|string|max:20',
            'prodi' => 'nullable|string|max:100',
            'fakultas' => 'nullable|string|max:100',
            'angkatan' => 'nullable|string|max:10',
            'organisasi' => 'nullable|string|max:100',
            'jabatan' => 'nullable|string|max:100',
            'alamat' => 'nullable|string|max:500',
            'bio' => 'nullable|string|max:500',
            'password_lama' => 'nullable|string',
            'password_baru' => ['nullable', 'string', Password::min(8)],
        ]);

        if (! empty($validated['nama'])) {
            $user->name = $validated['nama'];
        } elseif (! empty($validated['name'])) {
            $user->name = $validated['name'];
        }

        if (! empty($validated['nim'])) {
            $user->nim = $validated['nim'];
        }

        if (isset($validated['phone'])) {
            $user->phone = $validated['phone'];
        } elseif (isset($validated['noHp'])) {
            $user->phone = $validated['noHp'];
        }

        if (isset($validated['prodi'])) {
            $user->prodi = $validated['prodi'];
        }
        if (isset($validated['fakultas'])) {
            $user->fakultas = $validated['fakultas'];
        }
        if (isset($validated['angkatan'])) {
            $user->angkatan = $validated['angkatan'];
        }
        if (isset($validated['organisasi'])) {
            $user->organisasi = $validated['organisasi'];
        }
        if (isset($validated['jabatan'])) {
            $user->jabatan = $validated['jabatan'];
        }
        if (isset($validated['alamat'])) {
            $user->alamat = $validated['alamat'];
        }
        if (isset($validated['bio'])) {
            $user->bio = $validated['bio'];
        }

        // Handle password change if requested
        if (! empty($validated['password_baru'])) {
            if (empty($validated['password_lama']) || ! Hash::check($validated['password_lama'], $user->password)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Kata sandi lama tidak sesuai.',
                ], 422);
            }
            $user->password = Hash::make($validated['password_baru']);
        }

        $oldNim = $user->getOriginal('nim');
        $oldEmail = $user->getOriginal('email');

        $user->save();

        // Email/nim/password berubah → lookup login lama tidak boleh dipakai.
        LoginRepository::forgetFor($user, array_filter([$oldNim, $oldEmail]));

        return response()->json([
            'status' => 'success',
            'message' => 'Profil berhasil diperbarui.',
            'data' => [
                'id' => $user->id,
                'nama' => $user->name,
                'nim' => $user->nim,
                'email' => $user->email,
                'phone' => $user->phone ?? '',
                'noHp' => $user->phone ?? '',
                'prodi' => $user->prodi ?? '',
                'fakultas' => $user->fakultas ?? '',
                'angkatan' => $user->angkatan ?? '',
                'organisasi' => $user->organisasi ?? '',
                'jabatan' => $user->jabatan ?? '',
                'alamat' => $user->alamat ?? '',
                'bio' => $user->bio ?? '',
                'foto_url' => $user->foto_url ?? '',
                'is_active' => $user->is_active,
            ],
        ]);
    }

    /**
     * Upload / replace profile photo (PNG only).
     */
    public function uploadFoto(Request $request): JsonResponse
    {
        $request->validate([
            'foto' => 'required|file|mimes:png|max:5120',
        ], [
            'foto.required' => 'Pilih file foto terlebih dahulu.',
            'foto.mimes' => 'Format foto harus PNG.',
            'foto.max' => 'Ukuran foto maksimal 5 MB.',
        ]);

        $user = $request->user();
        $file = $request->file('foto');

        // Verify the real image type as well, not only the extension/mime header
        if (strtolower($file->extension()) !== 'png' || @getimagesize($file->getRealPath())['mime'] !== 'image/png') {
            return response()->json([
                'status' => 'error',
                'message' => 'Format foto harus PNG.',
            ], 422);
        }

        $oldPath = $user->foto_path;
        $path = $file->store('foto_profil', 'public');

        $user->foto_path = $path;
        $user->foto_url = url('storage/' . $path) . '?v=' . time();
        $user->save();

        if ($oldPath && $oldPath !== $path) {
            Storage::disk('public')->delete($oldPath);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Foto profil berhasil diperbarui.',
            'data' => [
                'foto_url' => $user->foto_url,
            ],
        ]);
    }

    /**
     * Remove profile photo.
     */
    public function deleteFoto(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->foto_path) {
            Storage::disk('public')->delete($user->foto_path);
        }

        $user->foto_path = null;
        $user->foto_url = null;
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Foto profil berhasil dihapus.',
            'data' => [
                'foto_url' => '',
            ],
        ]);
    }
}
