<?php

namespace Tests\Feature;

use App\Models\Peminjaman;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PeminjamanConflictAndUploadTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Room $room;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Agam Mujiono',
            'nim' => '2023001234',
            'email' => 'agam@kampus.ac.id',
            'password' => Hash::make('Password#123!'),
            'is_active' => true,
        ]);

        $this->room = Room::create([
            'name' => 'Auditorium Rektorat',
            'gedung' => 'Gedung Pusat Lt. 3',
            'kapasitas' => 500,
            'fasilitas' => ['Proyektor', 'Sound System', 'AC'],
            'status' => 'tersedia',
            'peminjaman_count' => 0,
        ]);
    }

    public function test_peminjaman_detects_schedule_conflict(): void
    {
        Sanctum::actingAs($this->user, ['user']);

        // First loan: 08:00 - 12:00 on 2026-10-15
        Peminjaman::create([
            'ticket_number' => '#RNG-2026-0001',
            'user_id' => $this->user->id,
            'room_id' => $this->room->id,
            'nama_kegiatan' => 'Seminar Teknologi Cloud',
            'organisasi' => 'BEM Fasilkom',
            'tanggal' => '2026-10-15',
            'jam_mulai' => '08:00',
            'jam_selesai' => '12:00',
            'estimasi_peserta' => 100,
            'status' => 'disetujui',
        ]);

        // Second loan overlapping: 10:00 - 14:00 on same room & date
        $response = $this->postJson('/api/user/peminjaman', [
            'nama_kegiatan' => 'Workshop AI',
            'organisasi' => 'Himpunan TI',
            'room_id' => $this->room->id,
            'tanggal' => '2026-10-15',
            'jam_mulai' => '10:00',
            'jam_selesai' => '14:00',
            'estimasi_peserta' => 50,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error')
            ->assertJsonFragment(['status' => 'error']);

        $this->assertStringContainsString('bentrok', strtolower($response->json('message')));
    }

    public function test_peminjaman_allows_non_overlapping_schedule(): void
    {
        Sanctum::actingAs($this->user, ['user']);

        // Existing loan: 08:00 - 12:00
        Peminjaman::create([
            'ticket_number' => '#RNG-2026-0002',
            'user_id' => $this->user->id,
            'room_id' => $this->room->id,
            'nama_kegiatan' => 'Kegiatan Pagi',
            'organisasi' => 'BEM Fasilkom',
            'tanggal' => '2026-10-15',
            'jam_mulai' => '08:00',
            'jam_selesai' => '12:00',
            'estimasi_peserta' => 50,
            'status' => 'disetujui',
        ]);

        // Subsequent loan: 13:00 - 17:00 (non-overlapping)
        $response = $this->postJson('/api/user/peminjaman', [
            'nama_kegiatan' => 'Kegiatan Siang',
            'organisasi' => 'Himpunan TI',
            'room_id' => $this->room->id,
            'tanggal' => '2026-10-15',
            'jam_mulai' => '13:00',
            'jam_selesai' => '17:00',
            'estimasi_peserta' => 50,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success');
    }

    public function test_peminjaman_supports_pdf_document_upload(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->user, ['user']);

        $file = UploadedFile::fake()->create('proposal_kegiatan.pdf', 500, 'application/pdf');

        $response = $this->post('/api/user/peminjaman', [
            'nama_kegiatan' => 'Pameran Karya Inovasi',
            'organisasi' => 'UKM Robotika',
            'room_id' => $this->room->id,
            'tanggal' => '2026-10-20',
            'jam_mulai' => '09:00',
            'jam_selesai' => '15:00',
            'estimasi_peserta' => 75,
            'berkas' => $file,
        ], ['Accept' => 'application/json']);

        $response->assertStatus(201);
        $data = $response->json('data');

        $this->assertNotNull($data['berkas_path']);
        $this->assertEquals('proposal_kegiatan.pdf', $data['berkas_name']);
        Storage::disk('public')->assertExists($data['berkas_path']);
    }

    public function test_user_can_view_and_update_extended_profile(): void
    {
        Sanctum::actingAs($this->user, ['user']);

        $getRes = $this->getJson('/api/user/profile');
        $getRes->assertStatus(200)
            ->assertJsonPath('data.nama', 'Agam Mujiono')
            ->assertJsonPath('data.nim', '2023001234');

        $updateRes = $this->putJson('/api/user/profile', [
            'nama' => 'Agam Mujiono Pratama',
            'phone' => '081234567890',
            'prodi' => 'Teknik Elektro',
            'fakultas' => 'Fakultas Teknik',
            'angkatan' => '2023',
            'organisasi' => 'Himpunan Mahasiswa Elektro',
            'jabatan' => 'Ketua Umum',
            'alamat' => 'Sleman, D.I. Yogyakarta',
            'bio' => 'Mahasiswa aktif bidang IoT dan robotika.',
        ]);

        $updateRes->assertStatus(200)
            ->assertJsonPath('data.nama', 'Agam Mujiono Pratama')
            ->assertJsonPath('data.prodi', 'Teknik Elektro')
            ->assertJsonPath('data.jabatan', 'Ketua Umum')
            ->assertJsonPath('data.bio', 'Mahasiswa aktif bidang IoT dan robotika.');

        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'name' => 'Agam Mujiono Pratama',
            'prodi' => 'Teknik Elektro',
            'jabatan' => 'Ketua Umum',
        ]);
    }
}
