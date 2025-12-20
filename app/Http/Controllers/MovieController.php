<?php

namespace App\Http\Controllers;

use App\Models\Movie;
use App\Models\MovieSchedule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class MovieController extends Controller
{
    public function index(Request $request)
    {
        $today = Carbon::today();
        
        // 1. Lấy filters
        $dateParam = $request->query('date', $today->format('Y-m-d'));
        $search = $request->query('search');
        $genre = $request->query('genre'); 
        $status = $request->query('status', 'now_showing');

        // 2. Xử lý ngày query
        if ($dateParam === 'all') {
            $queryDate = $today;
        } else {
            try {
                $queryDate = Carbon::parse($dateParam);
            } catch (\Exception $e) {
                $queryDate = $today;
                $dateParam = $today->format('Y-m-d');
            }
        }

        // 3. Tạo Date Bar (7 ngày)
        $dateBar = $this->generateDateBar($today, $dateParam);

        // 4. Logic lấy phim
        if ($search) {
            $finalMovieList = Movie::where('title', 'like', "%{$search}%")
                ->orWhere('cast', 'like', "%{$search}%")
                ->orderBy('release_date', 'desc')
                ->get();
        } 
        elseif ($dateParam === 'all') {
            $endDate = $today->copy()->addDays(7);
            $finalMovieList = Movie::join('movie_schedules', 'movies.movie_id', '=', 'movie_schedules.movie_id')
                ->whereBetween('movie_schedules.show_date', [$today, $endDate])
                ->select('movies.*')
                ->distinct()
                ->orderBy('movies.rating', 'desc')
                ->get();
        } 
        else {
            $finalMovieList = MovieSchedule::getListForDate($queryDate->format('Y-m-d'));
        }

        // Lọc thể loại
        if ($genre && $genre !== 'All') {
            $finalMovieList = $finalMovieList->filter(fn($m) => $m->genre && $m->genre->name === $genre)->values();
        }

        // ✅ 5. Tính ngày gần nhất cho tất cả phim (1 query duy nhất)
        $movieIds = $finalMovieList->pluck('movie_id')->toArray();
        
        $nearestDates = DB::table('movie_schedules')
            ->whereIn('movie_id', $movieIds)
            ->where('show_date', '>=', $today->format('Y-m-d'))
            ->select('movie_id', DB::raw('MIN(show_date) as nearest_date'))
            ->groupBy('movie_id')
            ->pluck('nearest_date', 'movie_id');

        // 6. Load Showtimes và gán nearest_date
        foreach ($finalMovieList as $movie) {
            $showtimeDate = ($dateParam === 'all') ? $today->format('Y-m-d') : $dateParam;
            
            $movie->setRelation('showtimes',
                $movie->showtimes()
                    ->whereDate('start_time', $showtimeDate)
                    ->when($showtimeDate === $today->format('Y-m-d'), fn($q) => $q->where('start_time', '>', now()))
                    ->orderBy('start_time')
                    ->take(4)
                    ->get()
            );

            // ✅ Gán ngày gần nhất từ movie_schedules
            $movie->nearest_showtime_date = $nearestDates[$movie->movie_id] ?? null;
        }

        // 7. Trả về
        $featureMovieData = $finalMovieList->first() ?? Movie::orderBy('rating', 'desc')->first();
        
        // Nếu feature movie không có nearest_date, tính riêng
        if ($featureMovieData && !isset($featureMovieData->nearest_showtime_date)) {
            $featureMovieData->nearest_showtime_date = DB::table('movie_schedules')
                ->where('movie_id', $featureMovieData->movie_id)
                ->where('show_date', '>=', $today->format('Y-m-d'))
                ->min('show_date');
        }

        $movies = $finalMovieList->map(fn($m) => $this->transformMovie($m, $today));
        $featureMovie = $this->transformMovie($featureMovieData, $today);

        return Inertia::render('Movies/Index', [
            'movies' => $movies->values(),
            'featureMovie' => $featureMovie ?: $this->getEmptyMovie(),
            'dateBar' => $dateBar,
            'filters' => [
                'status' => $status,
                'genre' => $genre,
                'date' => $dateParam,
                'search' => $search
            ]
        ]);
    }

    // --- CÁC HÀM HELPER ---
    private function generateDateBar($today, $selectedDateStr)
    {
        $dateBar = [];
        $dateBar[] = ['dayName' => 'Danh sách', 'date' => 'ALL', 'month' => 'Phim', 'fullValue' => 'all', 'isActive' => $selectedDateStr === 'all', 'isSpecial' => true];
        $weekMap = ['Sun' => 'CN', 'Mon' => 'Th 2', 'Tue' => 'Th 3', 'Wed' => 'Th 4', 'Thu' => 'Th 5', 'Fri' => 'Th 6', 'Sat' => 'Th 7'];
        for ($i = 0; $i < 7; $i++) {
            $d = $today->copy()->addDays($i);
            $dString = $d->format('Y-m-d');
            $dateBar[] = [
                'dayName' => $i === 0 ? 'Hôm nay' : $weekMap[$d->format('D')],
                'date' => $d->format('d'),
                'month' => $d->format('m'),
                'fullValue' => $dString,
                'isActive' => $dString === $selectedDateStr,
                'dayOfWeek' => $d->dayOfWeek,
                'isSpecial' => false
            ];
        }
        return $dateBar;
    }

    private function transformMovie($movie, $today) {
        if (!$movie) return null;
        $isComingSoon = $movie->release_date && Carbon::parse($movie->release_date)->gt($today);
        
        return [
            'id' => $movie->movie_id,
            'title' => $movie->title,
            'genre' => $movie->genre ? $movie->genre->name : '',
            'duration' => $this->formatDuration($movie->duration),
            'rating' => $movie->rating > 0 ? number_format($movie->rating, 1) : '?.?',
            'poster_url' => $movie->poster_url,
            'backdrop_url' => $movie->backdrop_url ?? $movie->poster_url,
            'trailer_url' => $movie->trailer_url,
            'release_date' => $movie->release_date ? Carbon::parse($movie->release_date)->format('Y-m-d') : null,
            'status' => $isComingSoon ? 'coming_soon' : 'now_showing',
            'showtimes' => $movie->showtimes->map(fn($s) => ['id' => $s->showtime_id, 'time' => Carbon::parse($s->start_time)->format('H:i')]),
            'nearest_showtime_date' => $movie->nearest_showtime_date ?? null, // ✅ Ngày từ movie_schedules
        ];
    }

    private function formatDuration($minutes) {
        $h = floor($minutes / 60);
        $m = $minutes % 60;
        return $h > 0 ? "{$h}h {$m}p" : "{$m}p";
    }

    private function getEmptyMovie() {
        return ['id'=>0, 'title'=>'Đang cập nhật', 'poster_url'=>'', 'backdrop_url'=>'', 'rating'=>0, 'duration'=>'', 'nearest_showtime_date'=>null];
    }
}