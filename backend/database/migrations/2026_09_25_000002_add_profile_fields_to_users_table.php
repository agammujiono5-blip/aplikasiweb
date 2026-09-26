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
        Schema::table('users', function (Blueprint $table) {
            $table->string('prodi', 100)->nullable()->after('phone');
            $table->string('fakultas', 100)->nullable()->after('prodi');
            $table->string('angkatan', 10)->nullable()->after('fakultas');
            $table->string('organisasi', 100)->nullable()->after('angkatan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['prodi', 'fakultas', 'angkatan', 'organisasi']);
        });
    }
};
