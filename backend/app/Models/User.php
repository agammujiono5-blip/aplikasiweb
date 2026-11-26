<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Sanctum\NewAccessToken;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'name',
        'nim',
        'email',
        'phone',
        'password',
        'password_reset_token',
        'password_reset_expires_at',
        'is_active',
        'prodi',
        'fakultas',
        'angkatan',
        'organisasi',
        'jabatan',
        'alamat',
        'bio',
        'foto_path',
        'foto_url',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'password_reset_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password_reset_expires_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Buat token sesi dengan masa berlaku 10 menit (sliding, diperpanjang
     * oleh middleware SlideSession selama pengguna aktif).
     */
    public function createSessionToken(string $name, array $abilities = []): NewAccessToken
    {
        return $this->createToken($name, $abilities, now()->addMinutes(PersonalAccessToken::SESSION_MINUTES));
    }

    public function peminjamans(): HasMany
    {
        return $this->hasMany(Peminjaman::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }
}
