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
        Schema::table('peminjaman', function (Blueprint $table) {
            $table->string('berkas_path')->nullable()->after('catatan');
            $table->string('berkas_url')->nullable()->after('berkas_path');
            $table->string('berkas_name')->nullable()->after('berkas_url');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('jabatan', 100)->nullable()->after('organisasi');
            $table->text('alamat')->nullable()->after('jabatan');
            $table->text('bio')->nullable()->after('alamat');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('peminjaman', function (Blueprint $table) {
            $table->dropColumn(['berkas_path', 'berkas_url', 'berkas_name']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['jabatan', 'alamat', 'bio']);
        });
    }
};
