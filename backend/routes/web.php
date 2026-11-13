<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('awal');
});

Route::get('/awal', function () {
    return view('awal');
});

/*
|--------------------------------------------------------------------------
| Halaman error HTTP (Blade)
|--------------------------------------------------------------------------
| Dipakai untuk pratinjau desain dan sebagai tujuan redirect ketika
| backend tidak bisa dihubungi. View yang sama juga dirender otomatis
| oleh Laravel lewat resources/views/errors/{kode}.blade.php.
*/

$errorCodes = [400, 401, 402, 403, 404, 405, 408, 409, 413, 419, 422, 429, 500, 501, 502, 503, 504];

Route::get('/errors/{code}', function (int $code) use ($errorCodes) {
    abort_unless(in_array($code, $errorCodes, true), 404);

    return response()->view("errors.{$code}", [], $code);
})->whereNumber('code')->name('errors.show');
