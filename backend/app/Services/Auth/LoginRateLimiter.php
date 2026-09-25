<?php

namespace App\Services\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class LoginRateLimiter
{
    /**
     * Maximum login attempts before lockout.
     */
    public const MAX_ATTEMPTS = 5;

    /**
     * Lockout duration in seconds (2 minutes = 120 seconds).
     */
    public const DECAY_SECONDS = 120;

    /**
     * Determine if the user has too many failed login attempts.
     */
    public function tooManyAttempts(string $credential, Request $request, string $type = 'user'): bool
    {
        return RateLimiter::tooManyAttempts($this->throttleKey($credential, $request, $type), self::MAX_ATTEMPTS);
    }

    /**
     * Increment the counter for failed login attempts.
     */
    public function hit(string $credential, Request $request, string $type = 'user'): int
    {
        return RateLimiter::hit($this->throttleKey($credential, $request, $type), self::DECAY_SECONDS);
    }

    /**
     * Get the number of seconds until the lock expires.
     */
    public function availableIn(string $credential, Request $request, string $type = 'user'): int
    {
        return RateLimiter::availableIn($this->throttleKey($credential, $request, $type));
    }

    /**
     * Get the number of remaining attempts for the user.
     */
    public function remaining(string $credential, Request $request, string $type = 'user'): int
    {
        return RateLimiter::remaining($this->throttleKey($credential, $request, $type), self::MAX_ATTEMPTS);
    }

    /**
     * Clear the login locks for the given credential and IP.
     */
    public function clear(string $credential, Request $request, string $type = 'user'): void
    {
        RateLimiter::clear($this->throttleKey($credential, $request, $type));
    }

    /**
     * Generate the throttle key based on credential, IP, and auth type.
     * Str::transliterate and lower prevents case/unicode manipulation attacks.
     */
    protected function throttleKey(string $credential, Request $request, string $type): string
    {
        $normalized = Str::transliterate(Str::lower(trim($credential)));
        $ip = $request->ip() ?? '127.0.0.1';
        return "login:{$type}:{$normalized}|{$ip}";
    }
}
