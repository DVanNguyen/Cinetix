<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Movie;
use App\Models\MovieSchedule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class MovieScheduleController extends Controller
{
    /**
     * =================================================================
     * PHẦN 1: QUẢN LÝ KHO PHIM (CRUD + LỌC THEO NGÀY)
     * View: resources/js/Pages/Admin/MovieAdminScreen.jsx
     * =================================================================
     */
    public function index(Request $request)
    {
        $today = Carbon::today();
        
        // 1. Lấy tham số ngày từ URL (mặc định là 'all')
        $selectedDate = $request->query('date', 'all'); 

        // 2. Logic lấy danh sách phim
        if ($selectedDate === 'all') {
            // Lấy toàn bộ phim, sắp xếp mới nhất
            $movies = Movie::orderBy('created_at', 'desc')->get();
        } else {
            // Lấy phim có lịch chiếu trong ngày được chọn
            // (Sử dụng Helper getListForDate trong Model MovieSchedule)
            $movies = MovieSchedule::getListForDate($selectedDate);
            
            // Đảm bảo luôn trả về mảng, tránh null gây lỗi frontend
            if (!$movies) $movies = [];
        }

        // 3. Tạo danh sách 14 ngày (Date Bar) để gửi xuống Frontend
        // Đây là phần quan trọng để tránh lỗi .map() ở MovieAdminScreen
        $dateList = [];
        
        // Thêm nút "Tất cả" đầu tiên
        $dateList[] = [
            'date' => 'all', 
            'display' => 'Tất cả', 
            'day' => 'ALL', 
            'isWeekend' => false
        ];
        
        // Vòng lặp 14 ngày tới
        for ($i = 0; $i < 14; $i++) {
            $d = $today->copy()->addDays($i);
            $dateList[] = [
                'date' => $d->format('Y-m-d'),
                'display' => $d->format('d/m'), 
                // Nếu là hôm nay thì hiện chữ "Hôm nay", còn lại hiện thứ (T2, T3...)
                'day' => ($i === 0) ? 'Hôm nay' : $this->getDayName($d->dayOfWeek),
                'isWeekend' => $d->isWeekend()
            ];
        }

        return Inertia::render('Admin/MovieAdminScreen', [
            'movies' => $movies,
            'dateList' => $dateList,       // Biến này sửa lỗi map
            'currentDate' => $selectedDate // Để highlight nút đang chọn
        ]);
    }

    // Hàm thêm phim mới
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'poster_url' => 'required|url',
            'duration' => 'required|integer|min:1',
            'rating' => 'nullable|numeric|min:0|max:10',
            'status' => 'required|in:now_showing,coming_soon,ended'
        ]);

        Movie::create($validated);
        return back()->with('success', 'Đã thêm phim mới thành công!');
    }

    // Hàm sửa phim
    public function update(Request $request, $id)
    {
        $movie = Movie::findOrFail($id);
        
        $validated = $request->validate([
            'title' => 'string|max:255',
            'poster_url' => 'url',
            'duration' => 'integer|min:1',
            'rating' => 'numeric|min:0|max:10',
            'status' => 'in:now_showing,coming_soon,ended'
        ]);

        $movie->update($validated);
        return back()->with('success', 'Cập nhật phim thành công!');
    }

    // Hàm xóa phim
    public function destroy($id)
    {
        Movie::findOrFail($id)->delete();
        return back()->with('success', 'Đã xóa phim khỏi hệ thống.');
    }

    /**
     * =================================================================
     * PHẦN 2: XẾP LỊCH CHIẾU (KÉO THẢ - HYBRID LOGIC)
     * View: resources/js/Pages/Admin/AdminScheduleScreen.jsx
     * =================================================================
     */
    public function schedule()
    {
        $today = Carbon::today();
        $dates = [];

        // 1. CHUẨN BỊ "KHO DỮ LIỆU"
        // Lấy danh sách phim đang chiếu rộng hơn (Top 20) để có đủ phim lọc theo "Thứ"
        $availableMovies = Movie::where('status', 'now_showing')
            ->orderBy('rating', 'desc') // Vẫn ưu tiên phim hay
            ->take(49) // Lấy 20 phim để thuật toán có không gian lựa chọn
            ->get();

        // Lấy phim sắp chiếu trong 14 ngày tới
        $upcomingMovies = Movie::where('status', 'coming_soon')
            ->whereBetween('release_date', [$today, $today->copy()->addDays(14)])
            ->get();

        // 2. TẠO DỮ LIỆU 14 NGÀY
        for ($i = 0; $i < 14; $i++) {
            $date = $today->copy()->addDays($i);
            $dateStr = $date->format('Y-m-d');

            // KIỂM TRA DB (Giữ nguyên logic cũ)
            $savedMovies = MovieSchedule::getListForDate($dateStr);

            if ($savedMovies->count() > 0) {
                $displayMovies = $savedMovies;
                $source = 'database';
            } else {
                // CHẠY THUẬT TOÁN MỚI
                $displayMovies = $this->generateAutoSchedule($i, $date, $availableMovies, $upcomingMovies);
                $source = 'auto';
            }

            $dates[] = [
                'date' => $dateStr,
                'display' => $date->format('d/m (D)'),
                'source' => $source,
                'movies' => $displayMovies
            ];
        }

        // 3. LẤY KHO PHIM SIDEBAR (Giữ nguyên)
        $allMovies = Movie::select('movie_id', 'title', 'poster_url', 'rating', 'duration')
            ->whereIn('status', ['now_showing', 'coming_soon'])
            ->orderBy('title')
            ->get();

        return Inertia::render('Admin/MovieScheduleScreen', [
            'dates' => $dates,
            'allMovies' => $allMovies
        ]);
    }

    /**
     * Priority: Ra mắt hôm nay > Trùng Thứ trong tuần > Rating cao
     */
    private function generateAutoSchedule($dayIndex, $date, $availableMovies, $upcomingMovies)
    {
        // 1. LAYER 1: PREMIERE (Phim ra mắt chính xác ngày này)
        // Đây là ưu tiên số 1, không thể thiếu.
        $premieres = $upcomingMovies->filter(function ($movie) use ($date) {
            return Carbon::parse($movie->release_date)->isSameDay($date);
        });

        // 2. LAYER 2: DAY-OF-WEEK MATCH (Trùng Thứ)
        // Ví dụ: Đang xếp lịch cho Thứ 5 -> Ưu tiên phim từng ra mắt vào Thứ 5.
        // Điều này giúp tạo thói quen (Phim bom tấn thường ra Thứ 5 hoặc Thứ 6).
        $weekDayMatches = $availableMovies->filter(function ($movie) use ($date) {
            return Carbon::parse($movie->release_date)->dayOfWeek === $date->dayOfWeek;
        });

        // 3. LAYER 3: FILLERS (Lấp đầy khoảng trống)
        // Logic Tuần 2: Nếu là tuần sau ($dayIndex >= 7), ta ưu tiên phim có Rating cao 
        // nhưng Sắp xếp lại theo Ngày phát hành Mới nhất để giảm bớt phim quá cũ lặp lại.
        $fillers = $availableMovies;
        
        if ($dayIndex >= 7) {
            // Tuần 2: Ưu tiên phim "Tươi" (Mới ra gần đây) hơn là phim "Điểm cao nhưng cũ"
            $fillers = $availableMovies->sortByDesc('release_date');
        }

        // 4. GỘP LẠI (Merge & Unique)
        // Thứ tự merge quyết định độ ưu tiên
        return $premieres
            ->merge($weekDayMatches) // Ưu tiên trùng thứ
            ->merge($fillers)        // Cuối cùng mới lấy phim thường để lấp đầy
            ->unique('movie_id')     // Loại bỏ phim trùng
            ->take(7)                // Chỉ lấy 7 phim
            ->values();              // Reset key
    }

    /**
     * API LƯU LỊCH (KHI ADMIN BẤM SAVE)
     */
    public function saveSchedule(Request $request, $date)
    {
        // Validate dữ liệu gửi lên
        $request->validate([
            'movies' => 'present|array', // Cho phép mảng rỗng (xóa hết lịch)
            'movies.*.movie_id' => 'required|exists:movies,movie_id'
        ]);

        // 1. Xóa sạch lịch cũ của ngày đó (Reset)
        MovieSchedule::where('show_date', $date)->delete();

        // 2. Lưu danh sách mới theo thứ tự Admin đã sắp xếp
        // Frontend gửi lên mảng movies[], ta lưu lại đúng thứ tự đó vào cột 'position'
        foreach ($request->movies as $index => $item) {
            MovieSchedule::create([
                'show_date' => $date,
                'movie_id' => $item['movie_id'],
                'position' => $index + 1 // Lưu vị trí: 1, 2, 3...
            ]);
        }

        return back()->with('success', 'Đã cập nhật lịch chiếu cho ngày ' . $date);
    }

    // Helper: Chuyển đổi số thứ tự ngày sang tên tiếng Việt ngắn gọn
    private function getDayName($dayIndex) {
        $days = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
        return $days[$dayIndex] ?? '';
    }
}