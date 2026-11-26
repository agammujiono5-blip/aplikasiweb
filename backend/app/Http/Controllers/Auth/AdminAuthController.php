<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\AdminLoginRequest;
use App\Models\Admin;
use App\Models\PersonalAccessToken;
use App\Services\Auth\LoginRateLimiter;
use App\Services\Auth\LoginRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminAuthController extends Controller
{
    public function __construct(
        protected LoginRateLimiter $rateLimiter,
        protected LoginRepository $lookup,
    ) {}

    /**
     * Authenticate Administrator with Rate Limiting (5 failed attempts -> 2 min lockout).
     * Separate table (admins) and separate guard/logic from regular users.
     */
    public function login(AdminLoginRequest $request): JsonResponse
    {
        $credential = $request->input('credential');
        $password = $request->input('password');

        // Check if locked out (5 attempts reached within 2 minutes)
        if ($this->rateLimiter->tooManyAttempts($credential, $request, 'admin')) {
            $seconds = $this->rateLimiter->availableIn($credential, $request, 'admin');
            $minutes = ceil($seconds / 60);

            return response()->json([
                'status' => 'error',
                'message' => "Terlalu banyak percobaan login admin gagal (maksimal 5 kali). Akses dikunci sementara selama {$seconds} detik ({$minutes} menit).",
                'locked' => true,
                'retry_after_seconds' => $seconds,
            ], 429);
        }

        // Eloquent parameterized query on separate admins table prevents SQL Injection.
        // Lookup diambil dari cache setelah login pertama (DB lambat/remote).
        [$admin] = $this->lookup->findAdmin($credential);

        // Check password against Argon2id/Bcrypt hash
        if (! $admin || ! $this->lookup->checkPassword($admin, $password)) {
            // Check if it's a student trying to log in through admin portal
            [$userExists] = $this->lookup->findUser($credential);
            if ($userExists && $this->lookup->checkPassword($userExists, $password)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Akun ini terdaftar sebagai Mahasiswa/Penyewa. Silakan masuk melalui halaman login Mahasiswa.',
                    'redirect' => '/login',
                ], 403);
            }

            $this->rateLimiter->hit($credential, $request, 'admin');
            $remaining = $this->rateLimiter->remaining($credential, $request, 'admin');

            return response()->json([
                'status' => 'error',
                'message' => 'ID Petugas/Email atau password admin salah.',
                'remaining_attempts' => $remaining,
            ], 401);
        }

        // Check active status
        if (! $admin->is_active) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akun administrator ini berstatus nonaktif.',
            ], 403);
        }

        // Login successful: Clear rate limiter
        $this->rateLimiter->clear($credential, $request, 'admin');

        // Password valid → simpan hash terenkripsi + rehash ke algoritma saat ini.
        $this->lookup->remember($admin, $password);
        $admin->save();

        $tokenInstance = $admin->createSessionToken('admin-token', ['admin']);
        $token = $tokenInstance->plainTextToken;
        PersonalAccessToken::cacheNewToken($token, $tokenInstance->accessToken, $admin);

        return response()->json([
            'status' => 'success',
            'message' => 'Login admin berhasil. Selamat bertugas!',
            'token' => $token,
            'session' => [
                'expires_in' => PersonalAccessToken::SESSION_MINUTES * 60,
                'expires_at' => now()->addMinutes(PersonalAccessToken::SESSION_MINUTES)->toIso8601String(),
            ],
            'role' => 'admin',
            'user' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'petugas_id' => $admin->petugas_id,
                'email' => $admin->email,
                'role' => $admin->role,
            ],
        ]);
    }

    /**
     * Get authenticated admin profile.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'role' => 'admin',
            'user' => $request->user(),
        ]);
    }

    /**
     * Logout admin and revoke token.
     */
    public function logout(Request $request): JsonResponse
    {
        $admin = $request->user();
        if ($admin && $admin->currentAccessToken()) {
            $admin->currentAccessToken()->delete();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Logout admin berhasil.',
        ]);
    }
}
