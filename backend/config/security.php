<?php

/*
|--------------------------------------------------------------------------
| Batas upload & keamanan
|--------------------------------------------------------------------------
| Nilai ini dipakai middleware ValidateMaximumContentLength. Harus selaras
| dengan nginx (client_max_body_size) dan php.ini (post_max_size).
|
*/

return [

    // Batas ukuran request body (byte). 50 MB:
    // - foto profil PNG  maks 5 MB
    // - berkas peminjaman PDF/DOCX maks 10 MB
    // Sisanya ruang untuk header & multipart boundary.
    'max_content_length' => (int) env('MAX_CONTENT_LENGTH', 50 * 1024 * 1024),

];
