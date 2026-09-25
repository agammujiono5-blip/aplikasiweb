<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Admin in separate 'admins' table
        Admin::updateOrCreate(
            ['petugas_id' => 'SARPRAS-001'],
            [
                'name' => 'Budi Santoso (Admin Sarpras)',
                'email' => 'admin@kampus.ac.id',
                'password' => Hash::make('Admin#Secure2024!'),
                'role' => 'superadmin',
                'is_active' => true,
            ]
        );

        // 2. Seed Mahasiswa/Penyewa in separate 'users' table
        User::updateOrCreate(
            ['nim' => '2021001234'],
            [
                'name' => 'Ahmad Pratama',
                'email' => 'mahasiswa@kampus.ac.id',
                'phone' => '081234567890',
                'password' => Hash::make('Mahasiswa#2024!'),
                'is_active' => true,
            ]
        );
    }
}
