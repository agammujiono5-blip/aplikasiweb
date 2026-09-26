<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\ForgotPasswordMail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ForgotPasswordController extends Controller
{
    /**
     * Send password reset link to user's email.
     */
    public function sendResetLink(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        // Always respond success for security (don't reveal if email exists)
        if (! $user) {
            return response()->json([
                'status' => 'success',
                'message' => 'Jika email terdaftar, link reset password telah dikirim. Periksa inbox Anda.',
            ]);
        }

        // Generate token and set expiry (1 hour)
        $token = Str::random(64);
        $user->update([
            'password_reset_token' => $token,
            'password_reset_expires_at' => Carbon::now()->addHour(),
        ]);

        $resetUrl = config('app.frontend_url', 'http://localhost:5173') . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);

        Mail::to($user->email)->send(new ForgotPasswordMail(
            userName: $user->name,
            resetToken: $token,
            resetUrl: $resetUrl,
        ));

        return response()->json([
            'status' => 'success',
            'message' => 'Jika email terdaftar, link reset password telah dikirim. Periksa inbox Anda.',
        ]);
    }

    /**
     * Reset user password using the token.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $request->email)
            ->where('password_reset_token', $request->token)
            ->first();

        if (! $user || ! $user->password_reset_expires_at || Carbon::now()->gt($user->password_reset_expires_at)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Token reset tidak valid atau sudah kedaluwarsa. Silakan minta link baru.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
            'password_reset_token' => null,
            'password_reset_expires_at' => null,
        ]);

        // Revoke all active tokens for security
        $user->tokens()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Password berhasil direset. Silakan login dengan password baru Anda.',
        ]);
    }
}
