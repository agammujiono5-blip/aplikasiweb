<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\Auth\AdminAuthController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\UserAuthController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PeminjamanController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Public Authentication
Route::post('/register', [UserAuthController::class, 'register'])->name('api.user.register');
Route::post('/login', [UserAuthController::class, 'login'])->name('api.user.login');
Route::post('/admin/login', [AdminAuthController::class, 'login'])->name('api.admin.login');

// Forgot / Reset Password (public)
Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink'])->name('api.forgot_password');
Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword'])->name('api.reset_password');

// Shared routes (available for both Penyewa and Admin)
Route::get('/rooms', [RoomController::class, 'index'])->name('api.rooms.index');
Route::get('/jadwal', [PeminjamanController::class, 'getJadwal'])->name('api.jadwal.index');

// Penyewa / Mahasiswa Protected Routes
Route::middleware(['auth:sanctum', 'auth.user'])->prefix('user')->group(function () {
    Route::get('/me', [UserAuthController::class, 'me'])->name('api.user.me');
    Route::post('/logout', [UserAuthController::class, 'logout'])->name('api.user.logout');

    Route::get('/profile', [UserController::class, 'getProfile'])->name('api.user.profile.get');
    Route::put('/profile', [UserController::class, 'updateProfile'])->name('api.user.profile.update');

    Route::get('/stats', [PeminjamanController::class, 'statsUser'])->name('api.user.stats');
    Route::get('/peminjaman', [PeminjamanController::class, 'indexUser'])->name('api.user.peminjaman.index');
    Route::post('/peminjaman', [PeminjamanController::class, 'storeUser'])->name('api.user.peminjaman.store');
    Route::patch('/peminjaman/{id}/cancel', [PeminjamanController::class, 'cancelUser'])->name('api.user.peminjaman.cancel');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('api.user.notifications.index');
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('api.user.notifications.unread_count');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('api.user.notifications.read_all');
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead'])->name('api.user.notifications.read');
});

// Admin Protected Routes
Route::middleware(['auth:sanctum', 'auth.admin'])->prefix('admin')->group(function () {
    Route::get('/me', [AdminAuthController::class, 'me'])->name('api.admin.me');
    Route::post('/logout', [AdminAuthController::class, 'logout'])->name('api.admin.logout');

    Route::get('/stats', [PeminjamanController::class, 'statsAdmin'])->name('api.admin.stats');
    Route::get('/peminjaman', [PeminjamanController::class, 'indexAdmin'])->name('api.admin.peminjaman.index');
    Route::patch('/peminjaman/{id}/status', [PeminjamanController::class, 'updateStatusAdmin'])->name('api.admin.peminjaman.status');

    Route::post('/rooms', [RoomController::class, 'store'])->name('api.admin.rooms.store');
    Route::put('/rooms/{id}', [RoomController::class, 'update'])->name('api.admin.rooms.update');
    Route::patch('/rooms/{id}/status', [RoomController::class, 'toggleStatus'])->name('api.admin.rooms.status');
    Route::delete('/rooms/{id}', [RoomController::class, 'destroy'])->name('api.admin.rooms.destroy');

    Route::get('/users', [UserController::class, 'indexAdmin'])->name('api.admin.users.index');
    Route::patch('/users/{id}/toggle-status', [UserController::class, 'toggleStatusAdmin'])->name('api.admin.users.toggle_status');

    // Activity Logs
    Route::get('/activity-logs', [ActivityLogController::class, 'index'])->name('api.admin.activity_logs');

    // Export
    Route::get('/peminjaman/export', [PeminjamanController::class, 'exportAdmin'])->name('api.admin.peminjaman.export');
});
