<?php

namespace App\Services\Auth;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;

/**
 * Menjembatani autentikasi dengan database yang lambat (mis. Supabase beda region).
 *
 * Masalah: satu SELECT lookup user memakan 300–2700 ms, sehingga login berulang
 * terasa 5–10 detik. Solusi:
 *
 *  1. Hasil lookup (termasuk hash password) disimpan per-credential di cache,
 *     sehingga login berikutnya tidak menyentuh DB sama sekali (~beberapa ms).
 *  2. Data dicache hanya setelah password terverifikasi, dan dienkripsi
 *     (APP_KEY) sehingga hash tidak tersimpan polos di Redis/disk.
 *  3. Password yang sudah terverifikasi di-hash ulang ke algoritma/cost saat
 *     ini (bcrypt cost 10) saat login berikutnya, sesuai rekomendasi Laravel.
 */
class LoginRepository
{
    /** IP palsu dipakai sebagai penanda keamanan pada kunci cache. */
    private const CACHED_IP = 'cache';

    private const TTL_SECONDS = 900;

    /**
     * Cari user lewat NIM atau email, dari cache bila memungkinkan.
     *
     * @return array{0: User|null, 1: bool} [user, dariCache]
     */
    public function findUser(string $credential): array
    {
        $key = $this->cacheKey('user', $credential);

        $cached = $this->readCache($key);
        if ($cached !== null) {
            return [$this->hydrateUser($cached), true];
        }

        return [
            User::where('nim', $credential)->orWhere('email', $credential)->first(),
            false,
        ];
    }

    /**
     * Cari admin lewat petugas_id atau email, dari cache bila memungkinkan.
     *
     * @return array{0: Admin|null, 1: bool} [admin, dariCache]
     */
    public function findAdmin(string $credential): array
    {
        $key = $this->cacheKey('admin', $credential);

        $cached = $this->readCache($key);
        if ($cached !== null) {
            return [$this->hydrateAdmin($cached), true];
        }

        return [
            Admin::where('petugas_id', $credential)->orWhere('email', $credential)->first(),
            false,
        ];
    }

    /**
     * Verifikasi password terhadap model yang di-cache (bila ada) atau DB.
     * Hash Argon2 tetap bisa diverifikasi walau pengaturan sekarang bcrypt.
     */
    public function checkPassword(User|Admin $account, string $password): bool
    {
        if (! Hash::isHashed($account->password)) {
            return false;
        }

        return Hash::check($password, $account->password);
    }

    /**
     * Simpan hasil lookup ke cache dan (bila perlu) hash ulang password ke
     * algoritma saat ini. Hanya dipanggil setelah password terverifikasi.
     */
    public function remember(User|Admin $account, string $plainPassword): void
    {
        $password = $account->password;

        if (Hash::needsRehash($password)) {
            $password = Hash::make($plainPassword);

            // Simpan di DB; umumnya di sini request tetap masuk DB.
            $account->forceFill(['password' => $password])->saveQuietly();
        }

        $attributes = $account->getAttributes();
        $attributes['password'] = $password;

        Cache::put(
            $this->cacheKey($account instanceof Admin ? 'admin' : 'user', $this->primaryCredential($account)),
            base64_encode(Crypt::encryptString(serialize($attributes))),
            self::TTL_SECONDS,
        );
    }

    /**
     * Hapus entri cache saat profil berganti (email/nim/password/is_active),
     * agar lookup berikutnya kembali ke DB dan data tidak basi.
     * `extra` memuat kredensial lama yang mungkin masih ter-cache.
     */
    public static function forgetFor(User|Admin $account, array $extra = []): void
    {
        $type = $account instanceof Admin ? 'admin' : 'user';
        $credentials = array_filter(array_merge(
            [$account->email, $account instanceof Admin ? $account->petugas_id : $account->nim],
            $extra,
        ));

        foreach (array_unique($credentials) as $credential) {
            Cache::forget(static::keyFor($type, (string) $credential));
        }
    }

    private static function keyFor(string $type, string $credential): string
    {
        return 'login_lookup:'.$type.':'.hash('sha256', mb_strtolower(trim($credential)));
    }

    private function primaryCredential(User|Admin $account): string
    {
        return $account instanceof Admin ? (string) $account->petugas_id : (string) $account->nim;
    }

    private function cacheKey(string $type, string $credential): string
    {
        return static::keyFor($type, $credential);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function readCache(string $key): ?array
    {
        /** @var string|null $payload */
        $payload = Cache::get($key);

        if (! is_string($payload)) {
            return null;
        }

        try {
            $attributes = unserialize(Crypt::decryptString(base64_decode($payload)), ['allowed_classes' => false]);
        } catch (DecryptException|\Throwable) {
            return null;
        }

        return is_array($attributes) ? $attributes : null;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function hydrateUser(array $attributes): User
    {
        $user = new User();
        $user->setRawAttributes($attributes, true);
        $user->exists = true;

        return $user;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function hydrateAdmin(array $attributes): Admin
    {
        $admin = new Admin();
        $admin->setRawAttributes($attributes, true);
        $admin->exists = true;

        return $admin;
    }
}
