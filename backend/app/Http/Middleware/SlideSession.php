<?php

namespace App\Http\Middleware;

use App\Models\PersonalAccessToken;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\Response;

class SlideSession
{
    /**
     * Sesi per pengguna: berlaku 10 menit sejak aktivitas terakhir.
     * Setiap request terautentikasi memperpanjang `expires_at` token, sehingga
     * pengguna yang masih aktif tidak perlu login ulang. Jika pengguna diam
     * lebih dari 10 menit, token kedaluwarsa dan harus login untuk mendapat
     * token (sesi) baru.
     *
     * Karena DB bisa berada di region lain (~300 ms/query), perpanjangan
     * ditulis ke DB paling banyak sekali per menit; di antaranya cukup cache
     * yang diperbarui sehingga tidak ada query tambahan di jalur request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->user()?->currentAccessToken();

        // Token lama (bukan Bearer PAT) atau request tanpa token: lewati.
        if (! $token instanceof PersonalAccessToken) {
            return $next($request);
        }

        if ($token->isSessionExpired()) {
            $token->delete();

            return response()->json([
                'status' => 'error',
                'message' => 'Sesi Anda telah berakhir karena tidak ada aktivitas selama 10 menit. Silakan login ulang.',
                'code' => 'SESSION_EXPIRED',
            ], 401);
        }

        $expiresAt = now()->addMinutes(PersonalAccessToken::SESSION_MINUTES);
        $token->extendSession($expiresAt);

        if ($this->needsDatabaseSync($token, $expiresAt)) {
            $token->saveExpiresAt($expiresAt);
        }

        $response = $next($request);

        $response->headers->set('X-Session-Expires-At', $expiresAt->toIso8601String());

        return $response;
    }

    /**
     * Tulis ke DB bila nilai di DB sudah tertinggal cukup jauh. Dengan selang
     * 1 menit, token yang DB-nya tertinggal maksimal 1 menit dari nilai cache
     * tetap berlaku dan tidak memicu logout palsu.
     */
    private function needsDatabaseSync(PersonalAccessToken $token, Carbon $expiresAt): bool
    {
        $stored = $token->getOriginal('expires_at');

        if (! $stored) {
            return true;
        }

        $storedExpires = Carbon::parse($stored);

        return $storedExpires->lt($expiresAt->copy()->subMinute());
    }
}
