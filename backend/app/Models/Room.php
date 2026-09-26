<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'gedung',
        'kapasitas',
        'fasilitas',
        'status',
        'peminjaman_count',
    ];

    protected $casts = [
        'fasilitas' => 'array',
        'kapasitas' => 'integer',
        'peminjaman_count' => 'integer',
    ];

    public function peminjamans(): HasMany
    {
        return $this->hasMany(Peminjaman::class);
    }
}
