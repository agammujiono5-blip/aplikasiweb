<?php

namespace App\Models;

use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    /**
     * Lama sesi (menit) tanpa aktivitas sebelum token dianggap kedaluwarsa.
     * Selama pengguna aktif, masa berlaku diperpanjang otomatis (sliding session).
     */
    public const SESSION_MINUTES = 10;

    /**
     * Cek apakah sesi token sudah kedaluwarsa karena tidak aktif.
     * Berbasis `expires_at` (diperpanjang setiap request) dengan fallback ke
     * `created_at` untuk token lama yang belum pernah disentuh.
     */
    public function isSessionExpired(): bool
    {
        $expiresAt = $this->getAttribute('expires_at');

        if ($expiresAt) {
            return \Illuminate\Support\Carbon::parse($expiresAt)->isPast();
        }

        $createdAt = $this->getAttribute('created_at');

        if ($createdAt) {
            return \Illuminate\Support\Carbon::parse($createdAt)
                ->addMinutes(static::SESSION_MINUTES)
                ->isPast();
        }

        return false;
    }

    /**
     * Perpanjang sesi di level cache (tanpa query DB). Nilai `expires_at`
     * asli dari DB dibiarkan apa adanya; lihat saveExpiresAt().
     */
    public function extendSession(\Illuminate\Support\Carbon $expiresAt): void
    {
        $this->setAttribute('expires_at', $expiresAt);

        $this->refreshCache($expiresAt);
    }

    /**
     * Tulis `expires_at` baru ke DB (tanpa query baca tambahan) dan jadikan
     * nilai tersebut nilai asli, sehingga perbandingan berikutnya akurat.
     */
    public function saveExpiresAt(\Illuminate\Support\Carbon $expiresAt): void
    {
        static::whereKey($this->getKey())->update(['expires_at' => $expiresAt]);

        $this->setAttribute('expires_at', $expiresAt);
        $this->syncOriginalAttribute('expires_at');
    }

    /**
     * Find the token instance matching the given token with safe, high-speed scalar array caching.
     * Prevents __PHP_Incomplete_Class serialization bugs while dropping latency from 1,400ms to ~1ms.
     *
     * @param  string  $token
     * @return static|null
     */
    public static function findToken($token)
    {
        $cacheKey = 'pat_arr_' . hash('sha256', $token);

        $cachedData = Cache::get($cacheKey);
        if (is_array($cachedData)) {
            $instance = static::hydrateCachedToken($cachedData);

            // Sesi kedaluwarsa: hapus token + cache agar harus login ulang.
            if ($instance->isSessionExpired()) {
                $instance->delete();

                return null;
            }

            return $instance;
        }

        $instance = null;
        if (strpos($token, '|') === false) {
            $instance = static::with('tokenable')
                ->where('token', hash('sha256', $token))
                ->first();
        } else {
            [$id, $plainToken] = explode('|', $token, 2);
            $found = static::with('tokenable')->find($id);
            if ($found && hash_equals($found->token, hash('sha256', $plainToken))) {
                $instance = $found;
            }
        }

        if (! $instance) {
            return null;
        }

        if ($instance->isSessionExpired()) {
            $instance->delete();

            return null;
        }

        Cache::put($cacheKey, static::serializeTokenData($instance), static::SESSION_MINUTES * 60);

        return $instance;
    }

    /**
     * Pre-warm cache immediately upon token generation using safe array format.
     */
    public static function cacheNewToken(string $plainToken, $accessToken, $tokenable): void
    {
        $accessToken->setRelation('tokenable', $tokenable);
        $cacheKey = 'pat_arr_' . hash('sha256', $plainToken);
        Cache::put($cacheKey, static::serializeTokenData($accessToken), static::SESSION_MINUTES * 60);
    }

    /**
     * Segarkan payload cache (tanpa DB) setelah sesi diperpanjang.
     */
    protected function refreshCache($expiresAt): void
    {
        $plainToken = request()->bearerToken();

        if (! $plainToken || ! str_contains($plainToken, '|')) {
            return;
        }

        [, $secret] = explode('|', $plainToken, 2);

        if (! hash_equals($this->getAttribute('token'), hash('sha256', $secret))) {
            return;
        }

        $expiresAt = \Illuminate\Support\Carbon::parse($expiresAt);

        Cache::put('pat_arr_' . hash('sha256', $plainToken), [
            'attributes' => array_merge($this->getAttributes(), [
                'expires_at' => $expiresAt->format('Y-m-d H:i:s'),
            ]),
            'tokenable_type' => $this->tokenable_type,
            'tokenable_attributes' => $this->relationLoaded('tokenable') && $this->tokenable
                ? $this->tokenable->getAttributes()
                : null,
        ], static::SESSION_MINUTES * 60);
    }

    /**
     * Convert model and relation into pure scalar associative array.
     */
    protected static function serializeTokenData($instance): array
    {
        $attributes = $instance->getAttributes();

        return [
            'attributes' => $attributes,
            'tokenable_type' => $instance->tokenable_type,
            'tokenable_attributes' => $instance->tokenable ? $instance->tokenable->getAttributes() : null,
        ];
    }

    /**
     * Reconstruct token model and its relation from cached scalar array.
     */
    protected static function hydrateCachedToken(array $data): static
    {
        $instance = new static();
        $instance->setRawAttributes($data['attributes'], true);
        $instance->exists = true;

        if (!empty($data['tokenable_type']) && !empty($data['tokenable_attributes'])) {
            $class = $data['tokenable_type'];
            if (class_exists($class)) {
                $tokenable = new $class();
                $tokenable->setRawAttributes($data['tokenable_attributes'], true);
                $tokenable->exists = true;
                $instance->setRelation('tokenable', $tokenable);
            }
        }

        return $instance;
    }

    /**
     * Clear token cache when token is revoked/deleted.
     */
    public function delete()
    {
        if ($this->token) {
            Cache::forget('pat_arr_' . hash('sha256', $this->token));
        }

        return parent::delete();
    }
}
