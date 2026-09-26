<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('peminjaman', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number', 50)->unique();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('room_id')->constrained('rooms')->onDelete('cascade');
            $table->string('nama_kegiatan');
            $table->string('organisasi');
            $table->string('jenis_kegiatan')->nullable();
            $table->date('tanggal');
            $table->string('jam_mulai', 10);
            $table->string('jam_selesai', 10);
            $table->integer('estimasi_peserta')->default(1);
            $table->text('keperluan')->nullable();
            $table->json('fasilitas')->nullable();
            $table->text('catatan')->nullable();
            $table->enum('status', ['menunggu', 'disetujui', 'ditolak'])->default('menunggu');
            $table->text('reject_note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('peminjaman');
    }
};
