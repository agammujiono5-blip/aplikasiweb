<?php

namespace Tests\Feature;

use App\Models\PersonalAccessToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Login yang di-cache: setelah password pernah terverifikasi, lookup berikutnya
 * tidak boleh menyentuh tabel `users` sehingga login berulang tetap cepat
 * walau DB (Supabase) berada di region lain.
 */
class LoginLookupCacheTest extends TestCase
{
    use RefreshDatabase;

    private function user(): User
    {
        return User::factory()->create([
            'nim' => '99887766',
            'email' => 'cache@example.com',
            'password' => 'Password123!',
            'is_active' => true,
        ]);
    }

    private function login(string $password = 'Password123!')
    {
        return $this->postJson('/api/login', [
            'credential' => '99887766',
            'password' => $password,
        ]);
    }

    public function test_login_kedua_tidak_membaca_tabel_users(): void
    {
        $this->user();

        $this->login()->assertOk();

        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = $query->sql;
        });

        $this->login()->assertOk();

        $userSelects = array_filter($queries, fn (string $sql) => str_contains($sql, 'from "users"') && str_starts_with($sql, 'select'));
        $this->assertEmpty($userSelects, 'Login kedua masih query tabel users: '.implode(' | ', $userSelects));
    }

    public function test_register_langsung_bisa_login_dari_cache(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Pendaftar Baru',
            'nim' => '11223344',
            'email' => 'baru@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertCreated();

        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = $query->sql;
        });

        $this->postJson('/api/login', [
            'credential' => '11223344',
            'password' => 'Password123!',
        ])->assertOk();

        $this->assertEmpty(array_filter(
            $queries,
            fn (string $sql) => str_contains($sql, 'from "users"') && str_starts_with($sql, 'select'),
        ));
    }

    public function test_password_salah_tetap_ditolak_dan_tidak_mengisi_cache(): void
    {
        $this->user();

        $this->login('PasswordSalah1!')->assertUnauthorized();
        $this->login('PasswordSalah1!')->assertUnauthorized();
    }

    public function test_ganti_password_membatalkan_cache_lama(): void
    {
        $user = $this->user();
        $this->login()->assertOk();

        $token = $user->createSessionToken('user-token', ['user']);
        PersonalAccessToken::cacheNewToken($token->plainTextToken, $token->accessToken, $user);

        $this->putJson('/api/user/profile', [
            'password_lama' => 'Password123!',
            'password_baru' => 'PasswordBaru456!',
        ], ['Authorization' => "Bearer {$token->plainTextToken}"])->assertOk();

        $this->login('Password123!')->assertUnauthorized();
        $this->login('PasswordBaru456!')->assertOk();
    }
}
