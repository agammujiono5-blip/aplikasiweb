<?php

namespace App\Http\Middleware;

use App\Models\PersonalAccessToken;
use Closure;
use Illuminate\Http\Request;
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
     * Biaya per request dijaga minimal: cache token sudah berisi data terbaru
     * dan hanya satu UPDATE ringan per request (tanpa query baca tambahan).
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

        $token->touchSession();

        $response = $next($request);

        $response->headers->set('X-Session-Expires-At', now()->addMinutes(PersonalAccessToken::SESSION_MINUTES)->toIso8601String());

        return $response;
    }
}
