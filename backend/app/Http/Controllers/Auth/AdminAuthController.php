<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\AdminLoginRequest;
use App\Models\Admin;
use App\Services\Auth\LoginRateLimiter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminAuthController extends Controller
{
    public function __construct(
        protected LoginRateLimiter $rateLimiter
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

        // Eloquent parameterized query on separate admins table prevents SQL Injection
        $admin = Admin::where('petugas_id', $credential)
            ->orWhere('email', $credential)
            ->first();

        // Check password against Argon2id/Bcrypt hash
        if (! $admin || ! Hash::check($password, $admin->password)) {
            // Check if it's a student trying to log in through admin portal
            $userExists = \App\Models\User::where('email', $credential)->orWhere('nim', $credential)->first();
            if ($userExists && Hash::check($password, $userExists->password)) {
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

        $tokenInstance = $admin->createToken('admin-token', ['admin']);
        $token = $tokenInstance->plainTextToken;
        \App\Models\PersonalAccessToken::cacheNewToken($token, $tokenInstance->accessToken, $admin);

        return response()->json([
            'status' => 'success',
            'message' => 'Login admin berhasil. Selamat bertugas!',
            'token' => $token,
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
