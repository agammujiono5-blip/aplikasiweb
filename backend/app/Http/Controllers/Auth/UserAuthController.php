<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\UserLoginRequest;
use App\Http\Requests\Auth\UserRegisterRequest;
use App\Models\PersonalAccessToken;
use App\Models\User;
use App\Services\Auth\LoginRateLimiter;
use App\Services\Auth\LoginRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserAuthController extends Controller
{
    public function __construct(
        protected LoginRateLimiter $rateLimiter,
        protected LoginRepository $lookup,
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

        // Cegah login pertama yang lambat: pengguna yang baru mendaftar
        // langsung tercatat di cache lookup, jadi tidak perlu SELECT ulang.
        $this->lookup->remember($user, $validated['password']);

        $tokenInstance = $user->createSessionToken('user-token', ['user']);
        $token = $tokenInstance->plainTextToken;
        PersonalAccessToken::cacheNewToken($token, $tokenInstance->accessToken, $user);

        return response()->json([
            'status' => 'success',
            'message' => 'Pendaftaran akun berhasil!',
            'token' => $token,
            'session' => [
                'expires_in' => PersonalAccessToken::SESSION_MINUTES * 60,
                'expires_at' => now()->addMinutes(PersonalAccessToken::SESSION_MINUTES)->toIso8601String(),
            ],
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

        // Eloquent parameterized query prevents SQL Injection.
        // Lookup diambil dari cache setelah login pertama (DB lambat/remote).
        [$user] = $this->lookup->findUser($credential);

        // Check password against Argon2id/Bcrypt hash
        if (! $user || ! $this->lookup->checkPassword($user, $password)) {
            // Check if it's an admin credential trying to log in through the student portal
            [$adminExists] = $this->lookup->findAdmin($credential);
            if ($adminExists && $this->lookup->checkPassword($adminExists, $password)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Akun ini terdaftar sebagai Administrator / Petugas Sarpras. Silakan masuk melalui halaman login Admin.',
                    'redirect' => '/admin/login',
                ], 403);
            }

            $this->rateLimiter->hit($credential, $request, 'user');
            $remaining = $this->rateLimiter->remaining($credential, $request, 'user');

            return response()->json([
                'status' => 'error',
                'message' => 'NIM/Email atau password salah.',
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

        // Password valid → aman menyimpan hash terenkripsi + rehash bila perlu.
        $this->lookup->remember($user, $password);
        $user->save();

        $tokenInstance = $user->createSessionToken('user-token', ['user']);
        $token = $tokenInstance->plainTextToken;
        PersonalAccessToken::cacheNewToken($token, $tokenInstance->accessToken, $user);

        return response()->json([
            'status' => 'success',
            'message' => 'Login berhasil. Selamat datang di SiPinjam Kampus!',
            'token' => $token,
            'session' => [
                'expires_in' => PersonalAccessToken::SESSION_MINUTES * 60,
                'expires_at' => now()->addMinutes(PersonalAccessToken::SESSION_MINUTES)->toIso8601String(),
            ],
            'role' => 'penyewa',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'nim' => $user->nim,
                'email' => $user->email,
                'phone' => $user->phone,
                'prodi' => $user->prodi,
                'fakultas' => $user->fakultas,
                'angkatan' => $user->angkatan,
                'organisasi' => $user->organisasi,
                'jabatan' => $user->jabatan,
                'alamat' => $user->alamat,
                'bio' => $user->bio,
            ],
        ]);
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        $u = $request->user();
        return response()->json([
            'status' => 'success',
            'role' => 'penyewa',
            'session' => [
                'expires_in' => PersonalAccessToken::SESSION_MINUTES * 60,
            ],
            'user' => [
                'id' => $u->id,
                'name' => $u->name,
                'nim' => $u->nim,
                'email' => $u->email,
                'phone' => $u->phone,
                'prodi' => $u->prodi,
                'fakultas' => $u->fakultas,
                'angkatan' => $u->angkatan,
                'organisasi' => $u->organisasi,
                'jabatan' => $u->jabatan,
                'alamat' => $u->alamat,
                'bio' => $u->bio,
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
