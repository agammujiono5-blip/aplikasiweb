<?php

/**
 * Katalog halaman error HTTP untuk aplikasi Laravel.
 *
 * Dipakai oleh resources/views/errors/*.blade.php lewat partial `errors/_page`.
 * Tambah entri di sini bila ingin mendukung kode baru, lalu buat file blade
 * bernama `<kode>.blade.php` yang meng-include partial tersebut.
 */
return [

    'meta' => [
        400 => [
            'name' => 'Bad Request',
            'title' => 'Permintaan tidak valid',
            'description' => 'Server tidak dapat memahami permintaan Anda karena format atau datanya tidak lengkap.',
            'hint' => 'Periksa kembali data yang Anda isi, lalu coba lagi.',
            'retry' => false,
            'login' => false,
        ],
        401 => [
            'name' => 'Unauthorized',
            'title' => 'Anda belum masuk',
            'description' => 'Halaman ini membutuhkan login. Sesi Anda mungkin sudah berakhir atau Anda belum masuk sama sekali.',
            'hint' => 'Masuk kembali untuk melanjutkan.',
            'retry' => false,
            'login' => true,
        ],
        402 => [
            'name' => 'Payment Required',
            'title' => 'Pembayaran diperlukan',
            'description' => 'Akses ke fitur ini membutuhkan pembayaran atau langganan aktif.',
            'hint' => 'Hubungi admin jika menurut Anda ini keliru.',
            'retry' => false,
            'login' => false,
        ],
        403 => [
            'name' => 'Forbidden',
            'title' => 'Akses ditolak',
            'description' => 'Anda sudah masuk, tetapi tidak memiliki hak akses untuk membuka halaman ini.',
            'hint' => 'Gunakan akun dengan role yang sesuai.',
            'retry' => false,
            'login' => true,
        ],
        404 => [
            'name' => 'Not Found',
            'title' => 'Waduh! Halaman tidak ditemukan.',
            'description' => 'Sepertinya halaman yang Anda tuju sudah menghilang seperti hantu. Periksa kembali alamatnya atau kembali ke beranda.',
            'hint' => '',
            'retry' => false,
            'login' => false,
        ],
        405 => [
            'name' => 'Method Not Allowed',
            'title' => 'Metode tidak diizinkan',
            'description' => 'Aksi yang Anda kirim tidak didukung oleh halaman ini.',
            'hint' => 'Gunakan navigasi menu di dalam aplikasi.',
            'retry' => false,
            'login' => false,
        ],
        408 => [
            'name' => 'Request Timeout',
            'title' => 'Waktu permintaan habis',
            'description' => 'Server terlalu lama menunggu permintaan Anda. Koneksi mungkin tidak stabil.',
            'hint' => 'Cek koneksi lalu muat ulang halaman.',
            'retry' => true,
            'login' => false,
        ],
        409 => [
            'name' => 'Conflict',
            'title' => 'Data bentrok',
            'description' => 'Permintaan Anda bentrok dengan data yang sudah ada, misalnya jadwal yang sudah dipesan.',
            'hint' => 'Muat ulang data terbaru sebelum mencoba lagi.',
            'retry' => false,
            'login' => false,
        ],
        413 => [
            'name' => 'Payload Too Large',
            'title' => 'File terlalu besar',
            'description' => 'Berkas yang Anda unggah melebihi ukuran maksimum yang diizinkan.',
            'hint' => 'Kompres berkas atau pilih berkas yang lebih kecil.',
            'retry' => false,
            'login' => false,
        ],
        419 => [
            'name' => 'Page Expired',
            'title' => 'Sesi halaman kedaluwarsa',
            'description' => 'Token keamanan (CSRF) sudah tidak berlaku. Halaman terlalu lama dibiarkan terbuka.',
            'hint' => 'Muat ulang halaman lalu kirim ulang formulir.',
            'retry' => true,
            'login' => false,
        ],
        422 => [
            'name' => 'Unprocessable Entity',
            'title' => 'Data tidak dapat diproses',
            'description' => 'Format data sudah benar, tetapi isinya tidak lolos validasi.',
            'hint' => 'Periksa setiap kolom dan kolom yang ditandai merah.',
            'retry' => false,
            'login' => false,
        ],
        429 => [
            'name' => 'Too Many Requests',
            'title' => 'Terlalu banyak permintaan',
            'description' => 'Anda mengirim permintaan terlalu sering dalam waktu singkat.',
            'hint' => 'Tunggu beberapa saat, lalu coba lagi.',
            'retry' => true,
            'login' => false,
        ],
        500 => [
            'name' => 'Internal Server Error',
            'title' => 'Terjadi kesalahan server',
            'description' => 'Ada masalah di sisi server saat memproses permintaan Anda.',
            'hint' => 'Coba muat ulang. Jika tetap gagal, hubungi admin.',
            'retry' => true,
            'login' => false,
        ],
        501 => [
            'name' => 'Not Implemented',
            'title' => 'Belum diimplementasikan',
            'description' => 'Fitur yang Anda minta belum tersedia di server ini.',
            'hint' => 'Fitur mungkin akan hadir pada pembaruan berikutnya.',
            'retry' => false,
            'login' => false,
        ],
        502 => [
            'name' => 'Bad Gateway',
            'title' => 'Gateway bermasalah',
            'description' => 'Server menerima respons yang tidak valid dari layanan lain di belakangnya.',
            'hint' => 'Tunggu sebentar lalu muat ulang halaman.',
            'retry' => true,
            'login' => false,
        ],
        503 => [
            'name' => 'Service Unavailable',
            'title' => 'Layanan sedang tidak tersedia',
            'description' => 'Server sedang sibuk atau dalam pemeliharaan. Layanan akan segera kembali.',
            'hint' => 'Coba beberapa menit lagi.',
            'retry' => true,
            'login' => false,
        ],
        504 => [
            'name' => 'Gateway Timeout',
            'title' => 'Gateway kehabisan waktu',
            'description' => 'Server di belakang tidak merespons tepat waktu.',
            'hint' => 'Muat ulang halaman beberapa saat lagi.',
            'retry' => true,
            'login' => false,
        ],
    ],

];
