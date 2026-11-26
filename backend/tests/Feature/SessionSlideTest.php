<?php

namespace Tests\Feature;

use App\Models\PersonalAccessToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sesi per pengguna: 10 menit tanpa aktivitas → token kedaluwarsa,
 * aktivitas memperpanjang masa sesi (sliding window).
 *
 * Token Bearer diuji sendiri (bukan actingAs) karena sesi berbasis
 * `expires_at` PAT, bukan sesi cookie/guard.
 */
class SessionSlideTest extends TestCase
{
    use RefreshDatabase;

    private string $plainToken = '';

    private function loginUser(): array
    {
        $user = User::factory()->create([
            'nim' => '1234567890',
            'email' => 'mahasiswa@example.com',
            'password' => 'Password123!',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/login', [
            'credential' => '1234567890',
            'password' => 'Password123!',
        ])->assertOk();

        $this->plainToken = $response->json('token');

        return [$user, $response->json('token'), $response->json('session')];
    }

    public function test_login_membuat_sesi_10_menit(): void
    {
        [, $token, $session] = $this->loginUser();

        $this->assertSame(600, $session['expires_in']);
        $this->assertNotEmpty($token);

        $this->assertDatabaseHas('personal_access_tokens', [
            'expires_at' => now()->addMinutes(PersonalAccessToken::SESSION_MINUTES)->toDateTimeString(),
        ]);
    }

    public function test_request_aktif_memperpanjang_sesi(): void
    {
        [$user] = $this->loginUser();
        $token = $user->tokens()->firstOrFail();

        // Waktu menjelang habis; request aktif harus memperpanjang kembali.
        $this->travel(9)->minutes();
        $token->forceFill(['expires_at' => now()->addMinute()])->save();
        $token = $token->fresh();
        PersonalAccessToken::cacheNewToken($this->plainToken, $token, $user);

        $this->getJson('/api/user/me', ['Authorization' => "Bearer {$this->plainToken}"])->assertOk();

        // DB disinkronkan paling sering sekali per menit, jadi nilai DB
        // boleh tertinggal sedikit namun tetap memperpanjang sesi.
        $this->assertTrue($token->fresh()->expires_at->greaterThan(now()->addMinute()));

        // Cache (jalur request) memegang nilai penuh: aktif walau 9 menit lagi.
        $this->travel(8)->minutes();
        $this->getJson('/api/user/me', ['Authorization' => "Bearer {$this->plainToken}"])->assertOk();
    }

    public function test_sesi_kedaluwarsa_setelah_10_menit_tanpa_aktivitas(): void
    {
        [$user] = $this->loginUser();

        $this->travel(11)->minutes();

        $this->getJson('/api/user/me', ['Authorization' => "Bearer {$this->plainToken}"])
            ->assertUnauthorized();

        // Token dihapus sehingga wajib login ulang untuk mendapatkan sesi baru.
        $this->assertSame(0, $user->tokens()->count());
    }
}
