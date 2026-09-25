<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\UserLoginRequest;
use App\Http\Requests\Auth\UserRegisterRequest;
use App\Models\User;
use App\Services\Auth\LoginRateLimiter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserAuthController extends Controller
{
    public function __construct(
        protected LoginRateLimiter $rateLimiter
    ) {}

    /**
     * Register a new Mahasiswa/Penyewa user.
     * Prevents SQL Injection through Eloquent parameterization & FormRequest validation.
     * Prevents Hashcat cracking through Argon2id / Bcrypt memory-hard hashing and password complexity.
     */
    public function register(UserRegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'nim' => $validated['nim'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'is_active' => true,
        ]);

        $token = $user->createToken('user-token', ['user'])->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Pendaftaran akun berhasil!',
            'token' => $token,
            'role' => 'penyewa',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'nim' => $user->nim,
                'email' => $user->email,
                'phone' => $user->phone,
            ],
        ], 201);
    }

    /**
     * Authenticate Mahasiswa/Penyewa with Rate Limiting (5 failed attempts -> 2 min lockout).
     */
    public function login(UserLoginRequest $request): JsonResponse
    {
        $credential = $request->input('credential');
        $password = $request->input('password');

        // Check if locked out (5 attempts reached within 2 minutes)
        if ($this->rateLimiter->tooManyAttempts($credential, $request, 'user')) {
            $seconds = $this->rateLimiter->availableIn($credential, $request, 'user');
            $minutes = ceil($seconds / 60);

            return response()->json([
                'status' => 'error',
                'message' => "Terlalu banyak percobaan login yang gagal (maksimal 5 kali). Akun Anda dikunci sementara selama {$seconds} detik ({$minutes} menit) demi alasan keamanan.",
                'locked' => true,
                'retry_after_seconds' => $seconds,
            ], 429);
        }

        // Eloquent parameterized query prevents SQL Injection
        $user = User::where('nim', $credential)
            ->orWhere('email', $credential)
            ->first();

        // Check password against Argon2id/Bcrypt hash
        if (! $user || ! Hash::check($password, $user->password)) {
            $this->rateLimiter->hit($credential, $request, 'user');
            $remaining = $this->rateLimiter->remaining($credential, $request, 'user');

            return response()->json([
                'status' => 'error',
                'message' => "NIM/Email atau kata sandi tidak sesuai. Sisa percobaan: {$remaining} kali.",
                'remaining_attempts' => $remaining,
            ], 401);
        }

        // Check active status
        if (! $user->is_active) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akun Anda dinonaktifkan oleh administrator. Silakan hubungi IT Support.',
            ], 403);
        }

        // Login successful: Clear rate limiter
        $this->rateLimiter->clear($credential, $request, 'user');

        $token = $user->createToken('user-token', ['user'])->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Login berhasil. Selamat datang di SiPinjam Kampus!',
            'token' => $token,
            'role' => 'penyewa',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'nim' => $user->nim,
                'email' => $user->email,
                'phone' => $user->phone,
            ],
        ]);
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'role' => 'penyewa',
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'nim' => $request->user()->nim,
                'email' => $request->user()->email,
                'phone' => $request->user()->phone,
            ],
        ]);
    }

    /**
     * Logout user and revoke token.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Logout berhasil. Sesi telah diakhiri.',
        ]);
    }
}
