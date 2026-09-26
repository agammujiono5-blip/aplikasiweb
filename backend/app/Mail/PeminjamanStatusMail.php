<?php

namespace App\Mail;

use App\Models\Peminjaman;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PeminjamanStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Peminjaman $peminjaman) {}

    public function envelope(): Envelope
    {
        $status = $this->peminjaman->status === 'disetujui' ? 'Disetujui ✅' : 'Ditolak ❌';
        return new Envelope(
            subject: "[SiPinjam] Pengajuan {$this->peminjaman->ticket_number} {$status}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.peminjaman_status',
        );
    }
}
