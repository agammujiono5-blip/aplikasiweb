<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->nullable()->constrained('admins')->onDelete('set null');
            $table->string('action', 100); // approve, reject, cancel, create_room, etc.
            $table->string('description');
            $table->string('subject_type', 100)->nullable(); // Peminjaman, Room, User
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->json('meta')->nullable(); // extra context (ticket_number, room_name, etc.)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
