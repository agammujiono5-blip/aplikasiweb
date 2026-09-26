<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AddServerTiming
{
    /**
     * Add precise microsecond-level execution timing headers to every API response.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $start = defined('LARAVEL_START') ? LARAVEL_START : microtime(true);

        $response = $next($request);

        $durationMs = round((microtime(true) - $start) * 1000, 2);

        $response->headers->set('X-Response-Time', "{$durationMs}ms");
        $response->headers->set('Server-Timing', "total;dur={$durationMs};desc=\"Total Processing Time\"");

        return $response;
    }
}
