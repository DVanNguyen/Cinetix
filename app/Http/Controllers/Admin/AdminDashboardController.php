<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Movie;
use App\Models\User;
use App\Models\Showtime;
use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today();
        $now = Carbon::now();

        // ========== 1. DOANH THU HÔM NAY ==========
        $dailyRevenue = Booking::whereDate('created_at', $today)
            ->where('payment_status', 'paid')
            ->sum('final_total');

        // ========== 2. SỐ VÉ BÁN RA HÔM NAY ==========
        $ticketsSoldToday = Booking::whereDate('created_at', $today)
            ->where('payment_status', 'paid')
            ->count();

        // ========== 3. PHIM ĐANG CHIẾU ==========
        $moviesShowing = Movie::whereHas('showtimes', function($query) use ($now) {
                $query->where('start_time', '>=', $now);
            })
            ->where('status', 'now_showing')
            ->count();

        // ========== 4. KHÁCH HÀNG MỚI TRONG THÁNG ==========
        $newCustomers = User::whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year)
            ->where('role', 'customer')
            ->count();

        // ========== 5. GIAO DỊCH GẦN NHẤT ==========
        $recentBookings = Booking::with(['user', 'showtime.movie'])
            ->where('payment_status', 'paid')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($booking) {
                return [
                    'id' => $booking->booking_id,
                    'user' => $booking->user ? $booking->user->name : 'Khách vãng lai',
                    'movie' => $booking->showtime->movie->title ?? 'Không xác định',
                    'total' => number_format($booking->final_total, 0, ',', '.'),
                    'time' => Carbon::parse($booking->created_at)->diffForHumans(),
                    'status' => $booking->payment_status
                ];
            });

        // ========== 6. TỈ LỆ LẤP ĐẦY GHẾ HÔM NAY (CẢI TIẾN) ==========
        $occupancyRate = $this->calculateOccupancyRate($today);

        // ========== 7. DOANH THU THÁNG NÀY ==========
        $monthlyRevenue = Booking::whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year)
            ->where('payment_status', 'paid')
            ->sum('final_total');

        // Mục tiêu doanh thu tháng
        $monthlyTarget = 100000000;
        $revenueProgress = $monthlyTarget > 0 
            ? min(round(($monthlyRevenue / $monthlyTarget) * 100, 1), 100) 
            : 0;

        // ========== 8. PHIM BÁN CHẠY NHẤT HÔM NAY ==========
        $topMovie = DB::table('bookings')
            ->join('showtimes', 'bookings.showtime_id', '=', 'showtimes.showtime_id')
            ->join('movies', 'showtimes.movie_id', '=', 'movies.movie_id')
            ->whereDate('bookings.created_at', $today)
            ->where('bookings.payment_status', 'paid')
            ->select('movies.title', DB::raw('COUNT(bookings.booking_id) as ticket_count'))
            ->groupBy('movies.movie_id', 'movies.title')
            ->orderBy('ticket_count', 'desc')
            ->first();

        // ========== 9. BIỂU ĐỒ DOANH THU 7 NGÀY GẦN NHẤT (CẢI TIẾN) ==========
        $revenueChart = $this->getRevenueChart(7);

        return Inertia::render('Admin/AdminDashboard', [
            'stats' => [
                'daily_revenue' => (int)$dailyRevenue,
                'tickets_sold' => $ticketsSoldToday,
                'movies_showing' => $moviesShowing,
                'new_customers' => $newCustomers,
            ],
            'recentBookings' => $recentBookings,
            'performance' => [
                'occupancy_rate' => $occupancyRate,
                'revenue_progress' => $revenueProgress,
                'monthly_revenue' => (int)$monthlyRevenue,
                'monthly_target' => $monthlyTarget,
                'top_movie' => [
                    'title' => $topMovie->title ?? 'Chưa có dữ liệu',
                    'tickets' => $topMovie->ticket_count ?? 0
                ]
            ],
            'revenueChart' => $revenueChart
        ]);
    }

    /**
     * ✅ TÍNH TỈ LỆ LẤP ĐẦY GHẾ CHO 1 NGÀY
     * Logic chi tiết: Chỉ tính các suất chiếu đã diễn ra hoặc đang diễn ra
     */
    private function calculateOccupancyRate($date)
    {
        $startOfDay = Carbon::parse($date)->startOfDay();
        $endOfDay = Carbon::parse($date)->endOfDay();
        $now = Carbon::now();

        // Lấy tất cả suất chiếu trong ngày (đã diễn ra hoặc đang diễn ra)
        $showtimes = Showtime::with('room')
            ->whereBetween('start_time', [$startOfDay, $endOfDay])
            ->get();

        if ($showtimes->isEmpty()) {
            return 0;
        }

        // Tổng số ghế có sẵn từ các suất chiếu
        $totalAvailableSeats = $showtimes->sum(function($showtime) {
            return $showtime->room->seat_count ?? 0;
        });

        if ($totalAvailableSeats === 0) {
            return 0;
        }

        // Đếm số ghế đã bán (chỉ tính booking đã thanh toán)
        $soldSeats = DB::table('booking_seats')
            ->join('bookings', 'booking_seats.booking_id', '=', 'bookings.booking_id')
            ->whereIn('bookings.showtime_id', $showtimes->pluck('showtime_id'))
            ->where('bookings.payment_status', 'paid')
            ->count();

        // Tính tỉ lệ phần trăm
        $occupancyRate = round(($soldSeats / $totalAvailableSeats) * 100, 1);

        return min($occupancyRate, 100); // Đảm bảo không vượt quá 100%
    }

    /**
     * ✅ LẤY BIỂU ĐỒ DOANH THU N NGÀY GẦN NHẤT
     * Bao gồm: Doanh thu, Số vé, Tỉ lệ lấp đầy
     */
    /**
     * ✅ LẤY BIỂU ĐỒ DOANH THU 7 NGÀY GẦN NHẤT (ĐÃ FIX)
     */
    private function getRevenueChart($days = 7)
    {
        $chart = [];
        $today = Carbon::today(); // Lấy ngày hiện tại làm mốc

        for ($i = $days - 1; $i >= 0; $i--) {
            // 1. QUAN TRỌNG: Dùng copy() để tạo bản sao, tránh làm sai lệch biến $today gốc
            $date = $today->copy()->subDays($i);
            
            // 2. TỐI ƯU: Gộp query Doanh thu và Số vé vào làm 1 lần gọi DB
            $stats = Booking::whereDate('created_at', $date)
                ->where('payment_status', 'paid')
                ->select(
                    DB::raw('COALESCE(SUM(final_total), 0) as revenue'),
                    DB::raw('COUNT(*) as tickets')
                )
                ->first();

            // 3. Gọi hàm tính tỉ lệ lấp đầy (Hàm này bạn phải sửa logic bỏ check giờ <= now như tôi đã gửi ở trên)
            $occupancy = $this->calculateOccupancyRate($date);

            // 4. Đếm số suất chiếu trong ngày
            $showtimeCount = Showtime::whereDate('start_time', $date)->count();

            $chart[] = [
                'date' => $date->format('d/m'),
                'full_date' => $date->format('Y-m-d'),
                'day_name' => $date->locale('vi')->isoFormat('dddd'), // Thứ Hai, Thứ Ba... (dùng dddd để hiện đầy đủ)
                'revenue' => (int) ($stats->revenue ?? 0), // Ép kiểu int để tránh lỗi null
                'tickets' => (int) ($stats->tickets ?? 0),
                'occupancy' => $occupancy,
                'showtimes' => $showtimeCount,
                'is_weekend' => $date->isWeekend()
            ];
        }

        return $chart;
    }

    /**
     * ✅ API: LẤY DỮ LIỆU REALTIME CHO DASHBOARD
     */
    public function getRealtimeStats()
    {
        $today = Carbon::today();

        $stats = [
            'daily_revenue' => Booking::whereDate('created_at', $today)
                ->where('payment_status', 'paid')
                ->sum('final_total'),
            'tickets_sold' => Booking::whereDate('created_at', $today)
                ->where('payment_status', 'paid')
                ->count(),
            'occupancy_rate' => $this->calculateOccupancyRate($today),
            'latest_booking' => Booking::with(['user', 'showtime.movie'])
                ->where('payment_status', 'paid')
                ->latest()
                ->first()
        ];

        return response()->json($stats);
    }

    /**
     * ✅ THỐNG KÊ CHI TIẾT TỈ LỆ LẤP ĐẦY THEO RẠP
     */
    public function getOccupancyByCinema(Request $request)
    {
        $date = $request->query('date', Carbon::today()->format('Y-m-d'));
        $parsedDate = Carbon::parse($date);

        $cinemas = DB::table('cinemas')
            ->select('cinemas.cinema_id', 'cinemas.name')
            ->get();

        $stats = [];

        foreach ($cinemas as $cinema) {
            // Lấy suất chiếu của rạp trong ngày
            $showtimes = Showtime::whereDate('start_time', $parsedDate)
                ->whereHas('room', function($q) use ($cinema) {
                    $q->where('cinema_id', $cinema->cinema_id);
                })
                ->with('room')
                ->get();

            if ($showtimes->isEmpty()) {
                $stats[] = [
                    'cinema_id' => $cinema->cinema_id,
                    'cinema_name' => $cinema->name,
                    'occupancy_rate' => 0,
                    'total_seats' => 0,
                    'sold_seats' => 0,
                    'showtimes_count' => 0
                ];
                continue;
            }

            $totalSeats = $showtimes->sum(fn($s) => $s->room->seat_count ?? 0);

            $soldSeats = DB::table('booking_seats')
                ->join('bookings', 'booking_seats.booking_id', '=', 'bookings.booking_id')
                ->whereIn('bookings.showtime_id', $showtimes->pluck('showtime_id'))
                ->where('bookings.payment_status', 'paid')
                ->count();

            $occupancyRate = $totalSeats > 0 
                ? round(($soldSeats / $totalSeats) * 100, 1) 
                : 0;

            $stats[] = [
                'cinema_id' => $cinema->cinema_id,
                'cinema_name' => $cinema->name,
                'occupancy_rate' => $occupancyRate,
                'total_seats' => $totalSeats,
                'sold_seats' => $soldSeats,
                'showtimes_count' => $showtimes->count()
            ];
        }

        return response()->json($stats);
    }

    /**
     * ✅ THỐNG KÊ CHI TIẾT THEO PHIM
     */
    public function getMoviePerformance(Request $request)
    {
        $startDate = Carbon::parse($request->query('start_date', Carbon::today()->subDays(7)));
        $endDate = Carbon::parse($request->query('end_date', Carbon::today()));

        $movies = DB::table('movies')
            ->join('showtimes', 'movies.movie_id', '=', 'showtimes.movie_id')
            ->leftJoin('bookings', 'showtimes.showtime_id', '=', 'bookings.showtime_id')
            ->whereBetween('showtimes.start_time', [$startDate, $endDate])
            ->where(function($q) {
                $q->whereNull('bookings.booking_id')
                  ->orWhere('bookings.payment_status', 'paid');
            })
            ->select(
                'movies.movie_id',
                'movies.title',
                'movies.poster_url',
                DB::raw('COUNT(DISTINCT showtimes.showtime_id) as total_showtimes'),
                DB::raw('COUNT(DISTINCT bookings.booking_id) as total_bookings'),
                DB::raw('COALESCE(SUM(bookings.final_total), 0) as total_revenue')
            )
            ->groupBy('movies.movie_id', 'movies.title', 'movies.poster_url')
            ->orderBy('total_revenue', 'desc')
            ->get();

        // Tính tỉ lệ lấp đầy cho từng phim
        $moviesWithOccupancy = $movies->map(function($movie) use ($startDate, $endDate) {
            $showtimes = Showtime::where('movie_id', $movie->movie_id)
                ->whereBetween('start_time', [$startDate, $endDate])
                ->with('room')
                ->get();

            $totalSeats = $showtimes->sum(fn($s) => $s->room->seat_count ?? 0);

            $soldSeats = DB::table('booking_seats')
                ->join('bookings', 'booking_seats.booking_id', '=', 'bookings.booking_id')
                ->whereIn('bookings.showtime_id', $showtimes->pluck('showtime_id'))
                ->where('bookings.payment_status', 'paid')
                ->count();

            $occupancy = $totalSeats > 0 
                ? round(($soldSeats / $totalSeats) * 100, 1) 
                : 0;

            return [
                'movie_id' => $movie->movie_id,
                'title' => $movie->title,
                'poster_url' => $movie->poster_url,
                'total_showtimes' => $movie->total_showtimes,
                'total_bookings' => $movie->total_bookings,
                'total_revenue' => (int)$movie->total_revenue,
                'occupancy_rate' => $occupancy,
                'avg_revenue_per_showtime' => $movie->total_showtimes > 0 
                    ? round($movie->total_revenue / $movie->total_showtimes) 
                    : 0
            ];
        });

        return response()->json($moviesWithOccupancy);
    }

    /**
     * ✅ THỐNG KÊ THEO KHOẢNG THỜI GIAN TÙY CHỈNH
     */
    public function getCustomStats(Request $request)
    {
        $startDate = Carbon::parse($request->start_date);
        $endDate = Carbon::parse($request->end_date);

        // Doanh thu
        $revenue = Booking::whereBetween('created_at', [$startDate, $endDate])
            ->where('payment_status', 'paid')
            ->sum('final_total');

        // Số vé
        $tickets = Booking::whereBetween('created_at', [$startDate, $endDate])
            ->where('payment_status', 'paid')
            ->count();

        // Top phim
        $topMovies = DB::table('bookings')
            ->join('showtimes', 'bookings.showtime_id', '=', 'showtimes.showtime_id')
            ->join('movies', 'showtimes.movie_id', '=', 'movies.movie_id')
            ->whereBetween('bookings.created_at', [$startDate, $endDate])
            ->where('bookings.payment_status', 'paid')
            ->select(
                'movies.title',
                DB::raw('COUNT(bookings.booking_id) as ticket_count'),
                DB::raw('SUM(bookings.final_total) as total_revenue')
            )
            ->groupBy('movies.movie_id', 'movies.title')
            ->orderBy('total_revenue', 'desc')
            ->take(5)
            ->get();

        // Tỉ lệ lấp đầy trung bình trong khoảng thời gian
        $days = $startDate->diffInDays($endDate) + 1;
        $totalOccupancy = 0;
        
        for ($i = 0; $i < $days; $i++) {
            $date = $startDate->copy()->addDays($i);
            $totalOccupancy += $this->calculateOccupancyRate($date);
        }
        
        $avgOccupancy = $days > 0 ? round($totalOccupancy / $days, 1) : 0;

        return response()->json([
            'revenue' => (int)$revenue,
            'tickets' => $tickets,
            'avg_occupancy' => $avgOccupancy,
            'top_movies' => $topMovies,
            'period' => [
                'start' => $startDate->format('d/m/Y'),
                'end' => $endDate->format('d/m/Y'),
                'days' => $days
            ]
        ]);
    }

    /**
     * ✅ BIỂU ĐỒ SO SÁNH DOANH THU THEO GIỜ TRONG NGÀY
     */
    public function getHourlyRevenue(Request $request)
    {
        $date = Carbon::parse($request->query('date', Carbon::today()));

        $hourlyStats = DB::table('bookings')
            ->join('showtimes', 'bookings.showtime_id', '=', 'showtimes.showtime_id')
            ->whereDate('showtimes.start_time', $date)
            ->where('bookings.payment_status', 'paid')
            ->select(
                DB::raw('HOUR(showtimes.start_time) as hour'),
                DB::raw('COUNT(bookings.booking_id) as bookings'),
                DB::raw('SUM(bookings.final_total) as revenue')
            )
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        // Tạo mảng 24 giờ (8:00 - 23:00 là khung giờ chính)
        $result = [];
        for ($h = 8; $h <= 23; $h++) {
            $stat = $hourlyStats->firstWhere('hour', $h);
            $result[] = [
                'hour' => $h . ':00',
                'bookings' => $stat->bookings ?? 0,
                'revenue' => (int)($stat->revenue ?? 0)
            ];
        }

        return response()->json($result);
    }
}