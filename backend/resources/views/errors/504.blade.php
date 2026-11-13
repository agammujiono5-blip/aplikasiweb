<?php
$code = 504;
$meta = config('http_status.meta.' . $code, [
    'name' => 'Error',
    'title' => 'Terjadi kesalahan (' . $code . ')',
    'description' => 'Permintaan Anda tidak dapat diselesaikan karena kesalahan yang tidak diketahui.',
    'hint' => 'Coba lagi atau kembali ke beranda.',
    'retry' => false,
    'login' => false,
]);

$name = $meta['name'];
$title = $meta['title'];
$description = $meta['description'];
$hint = $meta['hint'];
$retry = $meta['retry'];
$isLogin = $meta['login'];

// Halaman error dirender murni oleh server; tombol kembali mengarah ke root aplikasi.
$homeUrl = config('app.frontend_url', url('/'));
?>
@include('errors._page')
