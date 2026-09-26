<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - SiPinjam</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#342586,#4b3f9e);padding:32px 40px;text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:2px;text-transform:uppercase;">Universitas Negeri Yogyakarta</p>
              <h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:700;">SiPinjam</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Sistem Informasi Peminjaman Ruangan</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;background:#ece9fe;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;">🔑</div>
              </div>
              <h2 style="margin:0 0 12px;color:#111827;font-size:20px;font-weight:700;text-align:center;">Reset Password</h2>
              <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;text-align:center;">Halo, <strong>{{ $userName }}</strong>. Anda menerima email ini karena ada permintaan reset password untuk akun SiPinjam Anda.</p>

              <div style="text-align:center;margin:28px 0;">
                <a href="{{ $resetUrl }}"
                   style="display:inline-block;background:linear-gradient(135deg,#342586,#4b3f9e);color:#fff;text-decoration:none;padding:14px 32px;border-radius:999px;font-size:15px;font-weight:700;letter-spacing:0.3px;">
                  Reset Password Sekarang
                </a>
              </div>

              <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin-bottom:20px;">
                <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">⚠️ <strong>Perhatian:</strong> Link ini hanya berlaku selama <strong>1 jam</strong>. Jika Anda tidak meminta reset password, abaikan email ini — akun Anda tetap aman.</p>
              </div>

              <p style="margin:0;color:#6b7280;font-size:12px;text-align:center;">Atau salin link ini ke browser:<br>
                <span style="color:#4b3f9e;word-break:break-all;font-size:11px;">{{ $resetUrl }}</span>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">Email ini dikirim otomatis oleh sistem SiPinjam UNY. Jangan balas email ini.</p>
              <p style="margin:8px 0 0;color:#9ca3af;font-size:11px;">© {{ date('Y') }} Universitas Negeri Yogyakarta · SiPinjam</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
