<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('awal');
});

Route::get('/awal', function () {
    return view('awal');
});
