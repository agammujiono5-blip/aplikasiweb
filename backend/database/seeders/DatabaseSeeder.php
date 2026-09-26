<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Peminjaman;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with complete Admin and Penyewa records.
     */
    public function run(): void
    {
        // 1. Seed Admin
        Admin::updateOrCreate(
            ['petugas_id' => 'SARPRAS-001'],
            [
                'name' => 'Bpk. Hendra (Petugas Sarpras)',
                'email' => 'admin@kampus.ac.id',
                'password' => Hash::make('Admin#Secure2024!'),
                'role' => 'superadmin',
                'is_active' => true,
            ]
        );

        // 2. Seed Users (Mahasiswa / Penyewa)
        $usersData = [
            [
                'nim' => '2021001234',
                'name' => 'Rizky Dharma Pratama',
                'email' => 'rizky.dharma@mhs.nusantara.ac.id',
                'phone' => '081234567890',
                'prodi' => 'Teknik Informatika',
                'fakultas' => 'Fakultas Ilmu Komputer',
                'angkatan' => '2021',
                'organisasi' => 'BEM Fasilkom',
                'password' => Hash::make('Mahasiswa#2024!'),
                'is_active' => true,
            ],
            [
                'nim' => '2020005678',
                'name' => 'Siti Nurhaliza',
                'email' => 'siti.nurhaliza@mhs.nusantara.ac.id',
                'phone' => '081234567891',
                'prodi' => 'Teknik Elektro',
                'fakultas' => 'Fakultas Teknik',
                'angkatan' => '2020',
                'organisasi' => 'Himpunan Teknik Elektro',
                'password' => Hash::make('Mahasiswa#2024!'),
                'is_active' => true,
            ],
            [
                'nim' => '2022009012',
                'name' => 'Ahmad Fauzi',
                'email' => 'ahmad.fauzi@mhs.nusantara.ac.id',
                'phone' => '081234567892',
                'prodi' => 'Manajemen',
                'fakultas' => 'Fakultas Ekonomi & Bisnis',
                'angkatan' => '2022',
                'organisasi' => 'BEM Universitas',
                'password' => Hash::make('Mahasiswa#2024!'),
                'is_active' => true,
            ],
            [
                'nim' => '2021003456',
                'name' => 'Dewi Rahayu',
                'email' => 'dewi.rahayu@mhs.nusantara.ac.id',
                'phone' => '081234567893',
                'prodi' => 'Akuntansi',
                'fakultas' => 'Fakultas Ekonomi & Bisnis',
                'angkatan' => '2021',
                'organisasi' => 'Himpunan Akuntansi',
                'password' => Hash::make('Mahasiswa#2024!'),
                'is_active' => true,
            ],
            [
                'nim' => '2019007890',
                'name' => 'Budi Santoso',
                'email' => 'budi.santoso@mhs.nusantara.ac.id',
                'phone' => '081234567894',
                'prodi' => 'Hukum',
                'fakultas' => 'Fakultas Hukum',
                'angkatan' => '2019',
                'organisasi' => 'Dewan Mahasiswa',
                'password' => Hash::make('Mahasiswa#2024!'),
                'is_active' => false,
            ],
            [
                'nim' => '2022011234',
                'name' => 'Maya Putri',
                'email' => 'maya.putri@mhs.nusantara.ac.id',
                'phone' => '081234567895',
                'prodi' => 'Psikologi',
                'fakultas' => 'Fakultas Psikologi',
                'angkatan' => '2022',
                'organisasi' => 'UKM Paduan Suara',
                'password' => Hash::make('Mahasiswa#2024!'),
                'is_active' => true,
            ],
        ];

        $users = [];
        foreach ($usersData as $u) {
            $users[$u['nim']] = User::updateOrCreate(['nim' => $u['nim']], $u);
        }

        // 3. Seed Rooms
        $roomsData = [
            [
                'name' => 'Auditorium Rektorat Lt. 3',
                'gedung' => 'Gedung Rektorat',
                'kapasitas' => 500,
                'fasilitas' => ['Proyektor', 'Sound System', 'AC', 'Lighting', 'Podium'],
                'status' => 'terpakai',
                'peminjaman_count' => 13,
            ],
            [
                'name' => 'Aula Gedung A',
                'gedung' => 'Gedung A',
                'kapasitas' => 300,
                'fasilitas' => ['Proyektor', 'Sound System', 'AC', 'Podium'],
                'status' => 'tersedia',
                'peminjaman_count' => 11,
            ],
            [
                'name' => 'Lab Komputer B-101',
                'gedung' => 'Gedung B',
                'kapasitas' => 40,
                'fasilitas' => ['PC Workstation', 'AC', 'Proyektor'],
                'status' => 'tersedia',
                'peminjaman_count' => 5,
            ],
            [
                'name' => 'Ruang Seminar C-205',
                'gedung' => 'Gedung C',
                'kapasitas' => 80,
                'fasilitas' => ['Proyektor', 'Whiteboard', 'AC'],
                'status' => 'tersedia',
                'peminjaman_count' => 7,
            ],
            [
                'name' => 'Lab Multimedia Fasilkom',
                'gedung' => 'Gedung Fasilkom',
                'kapasitas' => 40,
                'fasilitas' => ['PC Workstation', 'AC'],
                'status' => 'terpakai',
                'peminjaman_count' => 10,
            ],
            [
                'name' => 'Ruang Rapat Dekanat',
                'gedung' => 'Gedung Rektorat',
                'kapasitas' => 20,
                'fasilitas' => ['TV LED', 'AC', 'Whiteboard'],
                'status' => 'maintenance',
                'peminjaman_count' => 3,
            ],
        ];

        $rooms = [];
        foreach ($roomsData as $r) {
            $rooms[$r['name']] = Room::updateOrCreate(['name' => $r['name']], $r);
        }

        // 4. Seed Peminjaman
        $peminjamanData = [
            [
                'ticket_number' => '#RNG-2024-8841',
                'user_id' => $users['2021001234']->id,
                'room_id' => $rooms['Auditorium Rektorat Lt. 3']->id,
                'nama_kegiatan' => 'Seminar Nasional Teknologi AI & Workshop Cloud 2024',
                'organisasi' => 'BEM Fasilkom',
                'jenis_kegiatan' => 'Seminar',
                'tanggal' => '2024-10-25',
                'jam_mulai' => '08:00',
                'jam_selesai' => '12:30',
                'estimasi_peserta' => 220,
                'keperluan' => 'Seminar teknologi nasional dan pengenalan cloud computing untuk mahasiswa',
                'fasilitas' => ['Proyektor', 'Sound System', 'AC'],
                'catatan' => 'Mohon bantuan teknisi sound system di awal acara',
                'status' => 'menunggu',
                'reject_note' => null,
            ],
            [
                'ticket_number' => '#RNG-2024-8902',
                'user_id' => $users['2020005678']->id,
                'room_id' => $rooms['Aula Gedung A']->id,
                'nama_kegiatan' => 'Workshop Robotik Tingkat Nasional',
                'organisasi' => 'Himpunan Teknik Elektro',
                'jenis_kegiatan' => 'Workshop',
                'tanggal' => '2024-10-28',
                'jam_mulai' => '09:00',
                'jam_selesai' => '17:00',
                'estimasi_peserta' => 150,
                'keperluan' => 'Pelatihan perakitan mikrokontroler dan robotika tingkat nasional',
                'fasilitas' => ['Proyektor', 'AC'],
                'catatan' => null,
                'status' => 'menunggu',
                'reject_note' => null,
            ],
            [
                'ticket_number' => '#RNG-2024-8915',
                'user_id' => $users['2022009012']->id,
                'room_id' => $rooms['Ruang Seminar C-205']->id,
                'nama_kegiatan' => 'Seminar Kewirausahaan Mahasiswa',
                'organisasi' => 'BEM Universitas',
                'jenis_kegiatan' => 'Seminar',
                'tanggal' => '2024-10-30',
                'jam_mulai' => '09:00',
                'jam_selesai' => '12:00',
                'estimasi_peserta' => 60,
                'keperluan' => 'Pembekalan startup dan wirausaha bagi mahasiswa baru',
                'fasilitas' => ['Proyektor', 'Whiteboard'],
                'catatan' => null,
                'status' => 'menunggu',
                'reject_note' => null,
            ],
            [
                'ticket_number' => '#RNG-2024-8710',
                'user_id' => $users['2021001234']->id,
                'room_id' => $rooms['Lab Multimedia Fasilkom']->id,
                'nama_kegiatan' => 'Pelatihan UI/UX Design & Coding Sprint',
                'organisasi' => 'BEM Fasilkom',
                'jenis_kegiatan' => 'Pelatihan',
                'tanggal' => '2024-10-26',
                'jam_mulai' => '09:00',
                'jam_selesai' => '15:00',
                'estimasi_peserta' => 40,
                'keperluan' => 'Pelatihan desain UI/UX dan implementasi frontend modern',
                'fasilitas' => ['PC Workstation', 'AC'],
                'catatan' => null,
                'status' => 'disetujui',
                'reject_note' => null,
            ],
            [
                'ticket_number' => '#RNG-2024-8622',
                'user_id' => $users['2021001234']->id,
                'room_id' => $rooms['Ruang Seminar C-205']->id,
                'nama_kegiatan' => 'Rapat Kerja Anggota Himpunan',
                'organisasi' => 'Himpunan Mahasiswa IF',
                'jenis_kegiatan' => 'Rapat',
                'tanggal' => '2024-10-21',
                'jam_mulai' => '13:00',
                'jam_selesai' => '17:00',
                'estimasi_peserta' => 50,
                'keperluan' => 'Evaluasi program kerja tengah semester',
                'fasilitas' => ['Whiteboard'],
                'catatan' => null,
                'status' => 'ditolak',
                'reject_note' => 'Ruangan sedang dalam masa pemeliharaan sistem tata udara dan kelistrikan.',
            ],
            [
                'ticket_number' => '#RNG-2024-8920',
                'user_id' => $users['2020005678']->id,
                'room_id' => $rooms['Aula Gedung A']->id,
                'nama_kegiatan' => 'Kuliah Tamu Teknik Sipil',
                'organisasi' => 'Himpunan Teknik Sipil',
                'jenis_kegiatan' => 'Kuliah Tamu',
                'tanggal' => '2024-10-25',
                'jam_mulai' => '13:00',
                'jam_selesai' => '15:00',
                'estimasi_peserta' => 100,
                'keperluan' => 'Kuliah tamu praktisi konstruksi dan manajemen proyek',
                'fasilitas' => ['Proyektor', 'Sound System', 'AC'],
                'catatan' => null,
                'status' => 'disetujui',
                'reject_note' => null,
            ],
            [
                'ticket_number' => '#RNG-2024-8930',
                'user_id' => $users['2022011234']->id,
                'room_id' => $rooms['Ruang Seminar C-205']->id,
                'nama_kegiatan' => 'Latihan Debat Mahasiswa',
                'organisasi' => 'UKM Debat',
                'jenis_kegiatan' => 'Latihan',
                'tanggal' => '2024-10-30',
                'jam_mulai' => '15:00',
                'jam_selesai' => '17:00',
                'estimasi_peserta' => 30,
                'keperluan' => 'Latihan intensif persiapan kompetisi debat nasional',
                'fasilitas' => ['Whiteboard', 'AC'],
                'catatan' => null,
                'status' => 'disetujui',
                'reject_note' => null,
            ],
        ];

        foreach ($peminjamanData as $p) {
            Peminjaman::updateOrCreate(['ticket_number' => $p['ticket_number']], $p);
        }
    }
}
