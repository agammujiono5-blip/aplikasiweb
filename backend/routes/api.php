<?php

use App\Http\Controllers\Auth\AdminAuthController;
use App\Http\Controllers\Auth\UserAuthController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [UserAuthController::class, 'register'])->name('api.user.register');
Route::post('/login', [UserAuthController::class, 'login'])->name('api.user.login');

Route::post('/admin/login', [AdminAuthController::class, 'login'])->name('api.admin.login');

Route::middleware(['auth:sanctum', 'auth.user'])->prefix('user')->group(function () {
    Route::get('/me', [UserAuthController::class, 'me'])->name('api.user.me');
    Route::post('/logout', [UserAuthController::class, 'logout'])->name('api.user.logout');
});

Route::middleware(['auth:sanctum', 'auth.admin'])->prefix('admin')->group(function () {
    Route::get('/me', [AdminAuthController::class, 'me'])->name('api.admin.me');
    Route::post('/logout', [AdminAuthController::class, 'logout'])->name('api.admin.logout');
});
