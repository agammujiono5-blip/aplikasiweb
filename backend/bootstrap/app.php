<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Contracts\Support\Responsable;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        /*
         | Sebelumnya aplikasi hanya dijalankan lokal. Kini berjalan di
         | container di belakang Nginx host (SSL termination), sehingga
         | header X-Forwarded-* harus dipercaya agar IP klien, rate limit
         | login dan deteksi HTTPS benar.
         |
         | trustProxies() hanya menulis state statis pada middleware
         | TrustProxies (Laravel 13) sehingga aman dipanggil saat bootstrap.
         | Default aktif; set TRUSTED_PROXIES=false untuk menonaktifkan.
         */
        $trustedProxies = env('TRUSTED_PROXIES', '*');

        if (! in_array(strtolower((string) $trustedProxies), ['0', 'false', 'off', ''], true)) {
            $middleware->trustProxies(
                at: $trustedProxies,
                headers: \Illuminate\Http\Request::HEADER_X_FORWARDED_FOR
                    | \Illuminate\Http\Request::HEADER_X_FORWARDED_HOST
                    | \Illuminate\Http\Request::HEADER_X_FORWARDED_PORT
                    | \Illuminate\Http\Request::HEADER_X_FORWARDED_PROTO,
            );
        }

        $middleware->append(\App\Http\Middleware\ValidateMaximumContentLength::class);
        $middleware->append(\App\Http\Middleware\AddServerTiming::class);
        $middleware->alias([
            'auth.admin' => \App\Http\Middleware\EnsureAdmin::class,
            'auth.user' => \App\Http\Middleware\EnsureUser::class,
            'session.slide' => \App\Http\Middleware\SlideSession::class,
        ]);

        /*
         | Aplikasi ini hanya punya route API & halaman error; tidak ada
         | route bernama `login`. Tanpa ini, guest yang membuka endpoint
         | terlindungi tanpa header JSON memicu "Route [login] not defined".
         | Frontend (login SPA) memakai token Bearer, jadi yang perlu
         | dilayani hanyalah 401 tanpa redirect.
         */
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        /*
         | Semua error non-JSON (akses browser langsung ke backend) dirender
         | memakai view errors/{kode}.blade.php. Kode yang belum punya view
         | sendiri otomatis dialihkan ke 500 agar tetap tampil rapi.
         */
        $exceptions->render(function (Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return null;
            }

            if ($e instanceof Responsable) {
                return null;
            }

            /*
             | AuthenticationException → 401 JSON (atau 401 tanpa body
             | untuk browser). Biarkan Laravel menanganinya; tanpa ini
             | renderer halaman error mengubahnya menjadi 500.
             */
            if ($e instanceof AuthenticationException) {
                return null;
            }

            $status = $e instanceof HttpExceptionInterface
                ? $e->getStatusCode()
                : 500;

            $view = "errors.{$status}";

            if (! view()->exists($view)) {
                $status = 500;
                $view = 'errors.500';
            }

            return response()->view($view, [], $status);
        });
    })->create();
