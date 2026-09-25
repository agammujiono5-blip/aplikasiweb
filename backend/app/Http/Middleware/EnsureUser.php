<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUser
{
    /**
     * Authorization Middleware: Ensures only users from the 'users' table (Mahasiswa/Penyewa) can access.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! ($user instanceof User)) {
            return response()->json([
                'success' => false,
                'status' => 'forbidden',
                'code' => 403,
                'message' => 'Otorisasi gagal: Rute ini khusus untuk Mahasiswa/Penyewa.',
                'detail' => 'Anda tidak memiliki akses untuk mengakses halaman ini.',
            ], 403);
        }

        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'status' => 'forbidden',
                'code' => 403,
                'message' => 'Akun Anda tidak aktif : Silahkan menghubungi Admin untuk mengaktifkan akun Anda.',
            ], 403);
        }

        return $next($request);
    }
}
