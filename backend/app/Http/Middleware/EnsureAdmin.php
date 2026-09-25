<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    /**
     * Authorization Middleware: Ensures only users from the 'admins' table can access.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! ($user instanceof Admin)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Otorisasi gagal: Rute ini khusus untuk Administrator. Mahasiswa/Penyewa dilarang mengakses.',
            ], 403);
        }

        if (! $user->is_active) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akun administrator Anda sedang nonaktif.',
            ], 403);
        }

        return $next($request);
    }
}
