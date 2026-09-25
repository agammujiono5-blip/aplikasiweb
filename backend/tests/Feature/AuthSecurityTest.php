<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('login:user:2021001234|127.0.0.1');
        RateLimiter::clear('login:admin:sarpras-001|127.0.0.1');
    }

    public function test_user_registration_with_strong_password_succeeds(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Bintang Mahasiswa',
            'nim' => '2023009999',
            'email' => 'bintang@kampus.ac.id',
            'phone' => '081299998888',
            'password' => 'Bintang#Secure99!',
            'password_confirmation' => 'Bintang#Secure99!',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'status',
                'token',
                'role',
                'user' => ['id', 'name', 'nim', 'email', 'phone'],
            ]);

        $this->assertDatabaseHas('users', [
            'nim' => '2023009999',
            'email' => 'bintang@kampus.ac.id',
        ]);
    }

    public function test_user_registration_fails_with_weak_password_hashcat_defense(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Weak User',
            'nim' => '2023001111',
            'email' => 'weak@kampus.ac.id',
            'password' => '123456',
            'password_confirmation' => '123456',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_user_login_succeeds_with_correct_credentials(): void
    {
        $user = User::create([
            'name' => 'User Test',
            'nim' => '2021001234',
            'email' => 'user@kampus.ac.id',
            'password' => Hash::make('Password#123!'),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/login', [
            'credential' => '2021001234',
            'password' => 'Password#123!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'role' => 'penyewa',
            ])
            ->assertJsonStructure(['token']);
    }

    public function test_admin_login_succeeds_from_separate_admins_table(): void
    {
        Admin::create([
            'petugas_id' => 'SARPRAS-001',
            'name' => 'Admin Sarpras',
            'email' => 'admin@kampus.ac.id',
            'password' => Hash::make('Admin#Secure2024!'),
            'role' => 'superadmin',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/admin/login', [
            'credential' => 'SARPRAS-001',
            'password' => 'Admin#Secure2024!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'role' => 'admin',
            ]);
    }

    public function test_rate_limiter_locks_out_after_5_failed_attempts_for_2_minutes(): void
    {
        User::create([
            'name' => 'Target User',
            'nim' => '2021001234',
            'email' => 'target@kampus.ac.id',
            'password' => Hash::make('Password#123!'),
            'is_active' => true,
        ]);

        // Attempt 1 to 5: should return 401 with remaining attempts decreasing
        for ($i = 1; $i <= 5; $i++) {
            $response = $this->postJson('/api/login', [
                'credential' => '2021001234',
                'password' => 'WrongPassword!',
            ]);
            $response->assertStatus(401);
        }

        // 6th attempt: should be locked out with HTTP 429
        $lockoutResponse = $this->postJson('/api/login', [
            'credential' => '2021001234',
            'password' => 'WrongPassword!',
        ]);

        $lockoutResponse->assertStatus(429)
            ->assertJson([
                'status' => 'error',
                'locked' => true,
            ]);

        $this->assertArrayHasKey('retry_after_seconds', $lockoutResponse->json());
        $this->assertGreaterThan(0, $lockoutResponse->json('retry_after_seconds'));
    }

    public function test_authorization_prevents_user_accessing_admin_endpoints(): void
    {
        $user = User::create([
            'name' => 'Normal User',
            'nim' => '2021001234',
            'email' => 'user@kampus.ac.id',
            'password' => Hash::make('Password#123!'),
            'is_active' => true,
        ]);

        $token = $user->createToken('user-token', ['user'])->plainTextToken;

        // User attempts to access admin endpoint -> 403 Forbidden
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/me');

        $response->assertStatus(403);
    }

    public function test_authorization_prevents_admin_accessing_user_endpoints(): void
    {
        $admin = Admin::create([
            'petugas_id' => 'SARPRAS-001',
            'name' => 'Admin Sarpras',
            'email' => 'admin@kampus.ac.id',
            'password' => Hash::make('Admin#Secure2024!'),
            'role' => 'superadmin',
            'is_active' => true,
        ]);

        $token = $admin->createToken('admin-token', ['admin'])->plainTextToken;

        // Admin attempts to access user endpoint -> 403 Forbidden
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/user/me');

        $response->assertStatus(403);
    }
}
