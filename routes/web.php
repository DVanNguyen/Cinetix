<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Controllers cho Client
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MovieController;
use App\Http\Controllers\ShowController;
use App\Http\Controllers\CinemaController;
use App\Http\Controllers\ChooseSeatController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\AccountController;

// Controllers cho Admin
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\MovieScheduleController;
use App\Http\Controllers\Admin\ShowtimeController;
use App\Http\Controllers\Admin\BookingAdminController;
use App\Http\Controllers\Admin\UserAdminController;

/*
|--------------------------------------------------------------------------
| ROUTES DÀNH CHO KHÁCH (PUBLIC)
|--------------------------------------------------------------------------
*/

Route::get('/', [MovieController::class, 'index'])->name('home');
Route::get('/movies/{id}', [ShowController::class, 'show'])->name('movies.show');
Route::get('/api/cinemas', [CinemaController::class, 'getCinemas']);

// Booking & Payment
Route::get('/booking/{showtime}/choose-seat', [ChooseSeatController::class, 'show'])->name('booking.choose_seat');
Route::post('/booking/lock-seat', [ChooseSeatController::class, 'lockSeat']);
Route::post('/booking/unlock-seat', [ChooseSeatController::class, 'unlockSeat']);
Route::get('/showtimes/{showtime}/seat-status', [ChooseSeatController::class, 'getSeatStatus'])->name('showtimes.seat-status');

Route::get('/payment', [PaymentController::class, 'index'])->name('payment.index');
Route::post('/payment/process', [PaymentController::class, 'process'])->name('payment.process');
Route::get('/payment/return', [PaymentController::class, 'paymentReturn'])->name('payment.return');
Route::get('/payment/result', [PaymentController::class, 'result'])->name('payment.result');

// Account
Route::middleware('auth')->group(function () {
    Route::get('/account', [AccountController::class, 'index'])->name('account.index');
    Route::post('/account/update-profile', [AccountController::class, 'updateProfile'])->name('account.update-profile');
    Route::post('/account/upload-avatar', [AccountController::class, 'uploadAvatar'])->name('account.upload-avatar');
    Route::post('/account/change-password', [AccountController::class, 'changePassword'])->name('account.change-password');
    Route::get('/account/tickets/{booking}', [AccountController::class, 'getTicketDetail'])->name('account.ticket-detail');
});

/*
|--------------------------------------------------------------------------
| ROUTES XÁC THỰC
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    Route::get('/login', function () {
        return Inertia::render('Auth/AuthScreen');
    })->name('login');
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});

Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');

/*
|--------------------------------------------------------------------------
| ROUTES DÀNH RIÊNG CHO ADMIN
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {

    // 1. DASHBOARD
    // URL: /admin/dashboard | Name: admin.dashboard
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    
    // API Dashboard
    Route::get('/dashboard/realtime', [AdminDashboardController::class, 'getRealtimeStats'])->name('dashboard.realtime');
    Route::get('/dashboard/movie-performance', [AdminDashboardController::class, 'getMoviePerformance'])->name('dashboard.movies'); // Đã sửa tên thừa
    Route::get('/dashboard/custom-stats', [AdminDashboardController::class, 'getCustomStats'])->name('dashboard.custom');
    Route::get('/dashboard/hourly-revenue', [AdminDashboardController::class, 'getHourlyRevenue'])->name('dashboard.hourly');

    // 2. QUẢN LÝ PHIM
    Route::get('/movies', [MovieScheduleController::class, 'index'])->name('movies.index');
    Route::post('/movies', [MovieScheduleController::class, 'store'])->name('movies.store');
    Route::put('/movies/{id}', [MovieScheduleController::class, 'update'])->name('movies.update');
    Route::delete('/movies/{id}', [MovieScheduleController::class, 'destroy'])->name('movies.destroy');

    // 3. XẾP LỊCH CHIẾU (Drag & Drop)
    Route::get('/movie-schedule', [MovieScheduleController::class, 'schedule'])->name('movies.schedule');
    Route::put('/movie-schedule/{date}', [MovieScheduleController::class, 'saveSchedule'])->name('movies.save_schedule');

    // 4. QUẢN LÝ SUẤT CHIẾU (ShowtimeController V2)
    Route::get('/showtimes', [ShowtimeController::class, 'index'])->name('showtimes.index');
    
    // Xếp lịch tự động (1 ngày)
    Route::post('/showtimes/auto', [ShowtimeController::class, 'generateAuto'])->name('showtimes.auto');
    
    // Xếp lịch toàn bộ (Nhiều ngày) -> Đã sửa tên bỏ 'admin.' thừa
    Route::post('/showtimes/bulk-generate', [ShowtimeController::class, 'bulkGenerate'])->name('showtimes.bulk');
    
    // Xóa suất chiếu (DELETE)
    Route::delete('/showtimes/{id}', [ShowtimeController::class, 'destroy'])->name('showtimes.destroy');

    // ✅ BỔ SUNG CÁC ROUTE CÒN THIẾU CỦA V2 (Để sau này dùng)
    Route::post('/showtimes/bulk-destroy', [ShowtimeController::class, 'bulkDestroy'])->name('showtimes.bulk-destroy');
    Route::post('/showtimes/clear-day', [ShowtimeController::class, 'clearDay'])->name('showtimes.clear-day');
    Route::get('/showtimes/check-changes', [ShowtimeController::class, 'checkChanges'])->name('showtimes.check-changes');

    // 5. BOOKINGS & USERS
    Route::get('/bookings', [BookingAdminController::class, 'index'])->name('bookings.index');
    Route::get('/users', [UserAdminController::class, 'index'])->name('users.index');
});