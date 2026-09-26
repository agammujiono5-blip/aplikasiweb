<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Peminjaman extends Model
{
    use HasFactory;

    protected $table = 'peminjaman';

    protected $fillable = [
        'ticket_number',
        'user_id',
        'room_id',
        'nama_kegiatan',
        'organisasi',
        'jenis_kegiatan',
        'tanggal',
        'jam_mulai',
        'jam_selesai',
        'estimasi_peserta',
        'keperluan',
        'fasilitas',
        'catatan',
        'berkas_path',
        'berkas_url',
        'berkas_name',
        'status',
        'reject_note',
    ];

    protected $casts = [
        'tanggal' => 'date:Y-m-d',
        'estimasi_peserta' => 'integer',
        'fasilitas' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
