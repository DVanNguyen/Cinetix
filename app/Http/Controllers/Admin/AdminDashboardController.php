<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Movie;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function index()
    {
        // Thiết lập thời gian là hôm nay
        $today = Carbon::today();

        // 1. TÍNH DOANH THU HÔM NAY
        // Logic: Lấy tổng cột 'final_total' của các vé đã thanh toán ('paid') trong ngày
        $dailyRevenue = Booking::whereDate('created_at', $today)
            ->where('payment_status', 'paid')
            ->sum('final_total');

        dd($dailyRevenue, $today->toDateTimeString());    

        // 2. TÍNH SỐ VÉ/ĐƠN BÁN RA HÔM NAY
        // Logic: Đếm số dòng trong bảng bookings có status là 'paid' trong ngày
        $ticketsSoldToday = Booking::whereDate('created_at', $today)
            ->where('payment_status', 'paid')
            ->count();

        // 3. ĐẾM SỐ PHIM ĐANG CHIẾU
        // Logic: Đếm số lượng phim có suất chiếu (start_time) lớn hơn hoặc bằng thời điểm hiện tại
        // Yêu cầu: Model Movie phải có quan hệ showtimes()
        $moviesShowing = Movie::whereHas('showtimes', function($query) {
            $query->where('start_time', '>=', now());
        })->count();

        // 4. KHÁCH HÀNG MỚI TRONG THÁNG
        // Logic: Đếm user được tạo trong tháng này và năm này (trừ admin nếu cần)
        $newCustomers = User::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            // ->where('role', '!=', 'admin') // Mở dòng này nếu bạn có cột role
            ->count();

        // 5. LẤY DANH SÁCH 5 GIAO DỊCH GẦN NHẤT
        $recentBookings = Booking::with(['user', 'showtime.movie']) // Eager load để tránh N+1 Query
            ->where('payment_status', 'paid')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($booking) {
                return [
                    'id'      => $booking->booking_id,
                    // Nếu user bị xóa hoặc null thì hiện "Khách vãng lai"
                    'user'    => $booking->user ? $booking->user->full_name : 'Khách vãng lai', 
                    'movie'   => $booking->showtime->movie->title ?? 'Không xác định',
                    // Format tiền tệ
                    'total'   => number_format($booking->final_total), 
                    // Format thời gian: "2 phút trước", "1 giờ trước"
                    'time'    => Carbon::parse($booking->created_at)->diffForHumans(), 
                    'status'  => $booking->payment_status
                ];
            });

        return Inertia::render('Admin/AdminDashboard', [
            'stats' => [
                'daily_revenue'  => (int)$dailyRevenue,
                'tickets_sold'   => $ticketsSoldToday,
                'movies_showing' => $moviesShowing,
                'new_customers'  => $newCustomers,
            ],
            'recentBookings' => $recentBookings
        ]);
    }
}