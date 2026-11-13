<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Tolak request body yang melebihi `security.max_content_length` lebih awal.
 *
 * Di belakang reverse proxy, Laravel membaca Content-Length dari klien
 * (nginx host juga membatasi lewat client_max_body_size). Middleware ini
 * mencegah konten besar diproses PHP bila Content-Length header tersedia.
 */
class ValidateMaximumContentLength
{
    public function handle(Request $request, Closure $next): Response
    {
        $max = (int) config('security.max_content_length', 50 * 1024 * 1024);

        // Content-Length dari klien (server var) atau header sebagai fallback.
        $length = (int) $request->server('CONTENT_LENGTH', 0)
            ?: (int) $request->headers->get('Content-Length', 0);

        if ($max > 0 && $length > $max) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Ukuran berkas terlalu besar. Maksimal ' . round($max / (1024 * 1024)) . ' MB.',
                ], 413);
            }

            abort(413);
        }

        return $next($request);
    }
}
