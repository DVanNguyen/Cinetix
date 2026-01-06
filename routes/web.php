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
| ROUTES DÀNH CHO KHÁCH (PUBLIC - Không cần đăng nhập)
|--------------------------------------------------------------------------
*/

// Trang chủ & Movies
Route::get('/', [MovieController::class, 'index'])->name('home');

// API công khai
Route::get('/api/cinemas', [CinemaController::class, 'getCinemas']);

/*
|--------------------------------------------------------------------------
| ROUTES XÁC THỰC (Authentication)
|--------------------------------------------------------------------------
*/

Route::middleware('guest')->group(function () {
    // Hiển thị form login/register (có thể nhận intended URL)
    Route::get('/login', [AuthController::class, 'show'])->name('login');
    Route::get('/auth', [AuthController::class, 'show'])->name('auth'); // Alias
    
    // Xử lý đăng nhập và đăng ký
    Route::post('/login', [AuthController::class, 'login'])->name('login.post');
    Route::post('/register', [AuthController::class, 'register'])->name('register');
});

// Đăng xuất (cần auth)
Route::post('/logout', [AuthController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

// Optional: API kiểm tra auth status
Route::get('/api/check-auth', [AuthController::class, 'checkAuth'])
    ->name('auth.check');

/*
|--------------------------------------------------------------------------
| ROUTES CẦN ĐĂNG NHẬP (Protected Routes)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth'])->group(function () {
    
    // Movie Detail & Booking (CẦN ĐĂNG NHẬP)
    Route::get('/movies/{id}', [ShowController::class, 'show'])->name('movies.show');
    
    // Booking Flow
    Route::get('/booking/{showtime}/choose-seat', [ChooseSeatController::class, 'show'])
        ->name('booking.choose_seat');
    Route::post('/booking/lock-seat', [ChooseSeatController::class, 'lockSeat'])
        ->name('booking.lock');
    Route::post('/booking/unlock-seat', [ChooseSeatController::class, 'unlockSeat'])
        ->name('booking.unlock');
    Route::get('/showtimes/{showtime}/seat-status', [ChooseSeatController::class, 'getSeatStatus'])
        ->name('showtimes.seat-status');

    // Payment Flow
    Route::get('/payment', [PaymentController::class, 'index'])->name('payment.index');
    Route::post('/payment/process', [PaymentController::class, 'process'])->name('payment.process');
    Route::get('/payment/return', [PaymentController::class, 'paymentReturn'])->name('payment.return');
    Route::get('/payment/result', [PaymentController::class, 'result'])->name('payment.result');

    // Account Management
    Route::prefix('account')->name('account.')->group(function () {
        Route::get('/', [AccountController::class, 'index'])->name('index');
        Route::post('/update-profile', [AccountController::class, 'updateProfile'])->name('update-profile');
        Route::post('/upload-avatar', [AccountController::class, 'uploadAvatar'])->name('upload-avatar');
        Route::post('/change-password', [AccountController::class, 'changePassword'])->name('change-password');
        Route::get('/tickets/{booking}', [AccountController::class, 'getTicketDetail'])->name('ticket-detail');
    });
});

/*
|--------------------------------------------------------------------------
| ROUTES DÀNH RIÊNG CHO ADMIN (Cần auth + role admin)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {

    // ========== 1. DASHBOARD ==========
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])
        ->name('dashboard');
    
    // API Dashboard Realtime
    Route::prefix('dashboard')->name('dashboard.')->group(function () {
        Route::get('/realtime', [AdminDashboardController::class, 'getRealtimeStats'])->name('realtime');
        Route::get('/occupancy-by-cinema', [AdminDashboardController::class, 'getOccupancyByCinema'])->name('occupancy');
        Route::get('/movie-performance', [AdminDashboardController::class, 'getMoviePerformance'])->name('movies');
        Route::get('/custom-stats', [AdminDashboardController::class, 'getCustomStats'])->name('custom');
        Route::get('/hourly-revenue', [AdminDashboardController::class, 'getHourlyRevenue'])->name('hourly');
    });

    // ========== 2. QUẢN LÝ PHIM ==========
    Route::prefix('movies')->name('movies.')->group(function () {
        Route::get('/', [MovieScheduleController::class, 'index'])->name('index');
        Route::post('/', [MovieScheduleController::class, 'store'])->name('store');
        Route::put('/{id}', [MovieScheduleController::class, 'update'])->name('update');
        Route::delete('/{id}', [MovieScheduleController::class, 'destroy'])->name('destroy');
    });

    // ========== 3. XẾP LỊCH CHIẾU (Drag & Drop) ==========
    Route::prefix('movie-schedule')->name('movies.')->group(function () {
        Route::get('/', [MovieScheduleController::class, 'schedule'])->name('schedule');
        Route::put('/{date}', [MovieScheduleController::class, 'saveSchedule'])->name('save_schedule');
    });

    // ========== 4. QUẢN LÝ SUẤT CHIẾU (Timeline) ==========
    Route::prefix('showtimes')->name('showtimes.')->group(function () {
        // Trang chính - Timeline
        Route::get('/', [ShowtimeController::class, 'index'])->name('index');
        
        // Xếp lịch tự động
        Route::post('/auto', [ShowtimeController::class, 'generateAuto'])->name('auto');
        Route::post('/bulk-generate', [ShowtimeController::class, 'bulkGenerate'])->name('bulk');
        
        // Xóa suất chiếu
        Route::delete('/{id}', [ShowtimeController::class, 'destroy'])->name('destroy');
        Route::post('/bulk-destroy', [ShowtimeController::class, 'bulkDestroy'])->name('bulk-destroy');
        Route::post('/clear-day', [ShowtimeController::class, 'clearDay'])->name('clear-day');
        
        // API kiểm tra
        Route::get('/check-changes', [ShowtimeController::class, 'checkChanges'])->name('check-changes');
    });

    // ========== 5. QUẢN LÝ BOOKINGS & USERS ==========
    Route::get('/bookings', [BookingAdminController::class, 'index'])->name('bookings.index');
    Route::get('/users', [UserAdminController::class, 'index'])->name('users.index');
});

/*
|--------------------------------------------------------------------------
| FALLBACK ROUTE (404)
|--------------------------------------------------------------------------
*/

Route::fallback(function () {
    return Inertia::render('Errors/404');
});
