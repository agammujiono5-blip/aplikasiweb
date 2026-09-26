<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /**
     * Get all users for DataPengguna (Admin only).
     * High speed cache for zero-delay user table loading.
     */
    public function indexAdmin(): JsonResponse
    {
        $mapped = Cache::remember('admin_users_list', 120, function () {
            $users = User::withCount([
                'peminjamans',
                'peminjamans as approved_peminjamans_count' => function ($q) {
                    $q->where('status', 'disetujui');
                },
            ])->orderBy('id', 'asc')->get();

            return $users->map(function ($u) {
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
                    'pengajuan' => $u->peminjamans_count,
                    'disetujui' => $u->approved_peminjamans_count,
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

        Cache::forget('admin_users_list');

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

        $user->save();

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
                'is_active' => $user->is_active,
            ],
        ]);
    }
}
