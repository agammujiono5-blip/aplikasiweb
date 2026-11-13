<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

/**
 * Konfigurasi production: batas upload dan rate limit endpoint autentikasi.
 * Login normal (satu percobaan berhasil) tidak boleh kena throttle atau 413.
 */
class ProductionHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        RateLimiter::clear('login:user:2021007777|127.0.0.1');
    }

    protected function makeUser(): User
    {
        return User::create([
            'name' => 'User Production',
            'nim' => '2021007777',
            'email' => 'prod@kampus.ac.id',
            'password' => Hash::make('Rahasia#2026!'),
            'is_active' => true,
        ]);
    }

    public function test_normal_login_is_not_throttled(): void
    {
        $this->makeUser();

        $this->postJson('/api/login', [
            'credential' => '2021007777',
            'password' => 'Rahasia#2026!',
        ])->assertOk()->assertJsonStructure(['token']);
    }

    public function test_login_route_has_throttle_middleware(): void
    {
        $route = app('router')->getRoutes()->getByName('api.user.login');

        $this->assertNotNull($route);
        $this->assertContains('throttle:20,1', $route->gatherMiddleware());
    }

    public function test_guest_request_without_json_header_returns_401_not_500(): void
    {
        // Browser biasa (tanpa Accept: application/json) ke endpoint terlindungi
        // tidak boleh 500 karena route `login` tidak ada.
        $this->withHeaders(['Accept' => 'text/html'])
            ->get('/api/user/me')
            ->assertStatus(401);

        $this->withHeaders(['Accept' => 'text/html'])
            ->get('/api/admin/me')
            ->assertStatus(401);
    }

    public function test_upload_beyond_configured_limit_is_rejected_with_json_413(): void
    {
        $user = $this->makeUser();
        $token = $user->createToken('user-token', ['user'])->plainTextToken;

        config(['security.max_content_length' => 1024]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/user/profile/foto', [
                'foto' => UploadedFile::fake()->image('foto.png', 10, 10),
            ], ['Content-Length' => '4096']);

        // Ditolak sebelum validasi/penyimpanan berkas.
        $response->assertStatus(413);
    }
}
