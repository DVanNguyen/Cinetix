<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Controllers cho Client (Khách hàng)
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

// Trang chủ
Route::get('/', [MovieController::class, 'index'])->name('home');

// Chi tiết phim & Suất chiếu
Route::get('/movies/{id}', [ShowController::class, 'show'])->name('movies.show');

// API lấy danh sách rạp (cho trang chi tiết)
Route::get('/api/cinemas', [CinemaController::class, 'getCinemas']);

// Quy trình đặt vé: Chọn ghế
Route::get('/booking/{showtime}/choose-seat', [ChooseSeatController::class, 'show'])->name('booking.choose_seat');

// API Khóa/Mở khóa ghế (Xử lý thời gian thực)
Route::post('/booking/lock-seat', [ChooseSeatController::class, 'lockSeat']);
Route::post('/booking/unlock-seat', [ChooseSeatController::class, 'unlockSeat']);

// 1. Hiển thị trang thanh toán (Nhận tham số showtime_id và seat_ids từ URL)
Route::get('/payment', [PaymentController::class, 'index'])->name('payment.index');

    // 2. Xử lý thanh toán (Khi bấm nút "Thanh toán ngay")
Route::post('/payment/process', [PaymentController::class, 'process'])->name('payment.process');

// routes/web.php hoặc routes/api.php
Route::get('/showtimes/{showtime}/seat-status', [ChooseSeatController::class, 'getSeatStatus'])
    ->name('showtimes.seat-status');    
    // Route Momo trả về
Route::get('/payment/return', [PaymentController::class, 'paymentReturn'])->name('payment.return');
    
    // Route hiển thị kết quả thành công/thất bại
Route::get('/payment/result', [PaymentController::class, 'result'])->name('payment.result');

Route::get('/account', [AccountController::class, 'index'])->name('account.index');

Route::post('/account/update-profile', [AccountController::class, 'updateProfile'])->name('account.update-profile');
Route::post('/account/upload-avatar', [AccountController::class, 'uploadAvatar'])->name('account.upload-avatar');
Route::post('/account/change-password', [AccountController::class, 'changePassword'])->name('account.change-password');

Route::get('/account/tickets/{booking}', [AccountController::class, 'getTicketDetail'])->name('account.ticket-detail');


/*
|--------------------------------------------------------------------------
| ROUTES XÁC THỰC (LOGIN / REGISTER / LOGOUT)
|--------------------------------------------------------------------------
*/

// Nhóm dành cho người CHƯA đăng nhập
Route::middleware('guest')->group(function () {
    // Hiển thị trang Login
    Route::get('/login', function () {
        return Inertia::render('Auth/AuthScreen'); // Đảm bảo bạn có file này ở Pages/Auth/AuthScreen.jsx
    })->name('login');

    // Xử lý logic Login/Register
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});

// Đăng xuất (Dành cho người ĐÃ đăng nhập)
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');


/*
|--------------------------------------------------------------------------
| ROUTES DÀNH RIÊNG CHO ADMIN
|--------------------------------------------------------------------------
| Tất cả route trong này đều có prefix là '/admin' và tên bắt đầu bằng 'admin.'
| Ví dụ: /admin/dashboard -> route('admin.dashboard')
*/

Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {

    // 1. DASHBOARD TỔNG QUAN
    // Trỏ trực tiếp đến Component Dashboard.jsx
    Route::get('/dashboard', function () {
        return Inertia::render('Admin/AdminDashboard'); 
    })->name('dashboard');


    // 2. QUẢN LÝ KHO PHIM (CRUD)
    // Route::resource tự động tạo index, store, update, destroy
    // Hoặc khai báo thủ công như dưới đây để dễ kiểm soát:
    Route::get('/movies', [MovieScheduleController::class, 'index'])->name('movies.index');
    Route::post('/movies', [MovieScheduleController::class, 'store'])->name('movies.store');
    Route::put('/movies/{id}', [MovieScheduleController::class, 'update'])->name('movies.update');
    Route::delete('/movies/{id}', [MovieScheduleController::class, 'destroy'])->name('movies.destroy');

    // 3. XẾP LỊCH CHIẾU (KÉO THẢ - HYBRID LOGIC)
    // Trang giao diện kéo thả (AdminScheduleScreen)
    Route::get('/movie-schedule', [MovieScheduleController::class, 'schedule'])->name('movies.schedule');
    
    // API Lưu lịch sau khi kéo thả
    Route::put('/movie-schedule/{date}', [MovieScheduleController::class, 'saveSchedule'])->name('movies.save_schedule');


    // 4. QUẢN LÝ SUẤT CHIẾU CHI TIẾT (TIMELINE)
    // Trang xem timeline các phòng chiếu
    Route::get('/showtimes', [ShowtimeController::class, 'index'])->name('showtimes.index');
    
    // API: Sinh suất chiếu tự động (nút "Tự động xếp" ở Frontend)
    Route::post('/showtimes/auto', [ShowtimeController::class, 'generateAuto'])->name('showtimes.auto');
    
    // API: Sửa/Xóa suất chiếu thủ công (nếu có)
    Route::post('/showtimes', [ShowtimeController::class, 'store'])->name('showtimes.store');


    Route::get('/bookings', [BookingAdminController::class, 'index'])->name('bookings.index');

    Route::get('/users', [UserAdminController::class, 'index'])->name('users.index');
});