<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Status Peminjaman - SiPinjam</title>
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
          <!-- Status Badge -->
          <tr>
            <td style="padding:32px 40px 0;text-align:center;">
              @if($peminjaman->status === 'disetujui')
                <div style="display:inline-block;background:#d1fae5;color:#065f46;padding:8px 20px;border-radius:999px;font-size:14px;font-weight:700;">✅ Pengajuan Disetujui</div>
              @else
                <div style="display:inline-block;background:#fee2e2;color:#991b1b;padding:8px 20px;border-radius:999px;font-size:14px;font-weight:700;">❌ Pengajuan Ditolak</div>
              @endif
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:24px 40px;">
              <p style="margin:0 0 16px;color:#374151;font-size:15px;">Halo, <strong>{{ $peminjaman->user?->name ?? 'Mahasiswa' }}</strong>,</p>
              @if($peminjaman->status === 'disetujui')
                <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">Selamat! Pengajuan peminjaman ruangan Anda telah <strong>disetujui</strong> oleh administrator. Berikut detail pengajuan Anda:</p>
              @else
                <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">Mohon maaf, pengajuan peminjaman ruangan Anda <strong>tidak dapat disetujui</strong> oleh administrator. Berikut detail pengajuan Anda:</p>
              @endif

              <!-- Detail Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fc;border-radius:12px;border:1px solid #e5e7eb;">
                <tr><td style="padding:20px;">
                  <table width="100%" cellpadding="0" cellspacing="6">
                    <tr>
                      <td style="color:#6b7280;font-size:12px;width:140px;">No. Tiket</td>
                      <td style="color:#111827;font-size:13px;font-weight:700;font-family:monospace;">{{ $peminjaman->ticket_number }}</td>
                    </tr>
                    <tr><td colspan="2" style="padding:4px 0;border-bottom:1px solid #e5e7eb;"></td></tr>
                    <tr>
                      <td style="color:#6b7280;font-size:12px;padding-top:8px;">Nama Kegiatan</td>
                      <td style="color:#111827;font-size:13px;padding-top:8px;">{{ $peminjaman->nama_kegiatan }}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b7280;font-size:12px;padding-top:6px;">Ruangan</td>
                      <td style="color:#111827;font-size:13px;padding-top:6px;">{{ $peminjaman->room?->name ?? '-' }}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b7280;font-size:12px;padding-top:6px;">Tanggal</td>
                      <td style="color:#111827;font-size:13px;padding-top:6px;">{{ \Carbon\Carbon::parse($peminjaman->tanggal)->translatedFormat('d F Y') }}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b7280;font-size:12px;padding-top:6px;">Waktu</td>
                      <td style="color:#111827;font-size:13px;padding-top:6px;">{{ $peminjaman->jam_mulai }} – {{ $peminjaman->jam_selesai }} WIB</td>
                    </tr>
                    @if($peminjaman->status === 'ditolak' && $peminjaman->reject_note)
                    <tr><td colspan="2" style="padding:8px 0 0;"></td></tr>
                    <tr>
                      <td colspan="2" style="background:#fee2e2;border-radius:8px;padding:12px;color:#991b1b;font-size:13px;">
                        <strong>Alasan Penolakan:</strong><br>{{ $peminjaman->reject_note }}
                      </td>
                    </tr>
                    @endif
                  </table>
                </td></tr>
              </table>

              @if($peminjaman->status === 'ditolak')
                <p style="margin:20px 0 0;color:#374151;font-size:13px;line-height:1.6;">Anda dapat mengajukan kembali permohonan peminjaman melalui portal SiPinjam dengan memilih jadwal atau ruangan yang berbeda.</p>
              @endif
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
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
