<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Movie;
use App\Models\MovieSchedule;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class MovieScheduleSeeder extends Seeder
{
    public function run()
    {
        // Xóa dữ liệu cũ để tránh trùng lặp
        DB::table('movie_schedules')->truncate();

        // Lấy tất cả phim đang có
        $movies = Movie::where('status', 'now_showing')->get();
        
        if($movies->count() == 0) {
            $this->command->info('Chưa có phim nào trong bảng movies! Hãy seed movies trước.');
            return;
        }

        $today = Carbon::today();

        // Tạo lịch cho 7 ngày tới
        for ($i = 0; $i < 7; $i++) {
            $date = $today->copy()->addDays($i);
            
            // Mỗi ngày chọn ngẫu nhiên 7 phim để chiếu
            $randomMovies = $movies->random(min(7, $movies->count()));

            foreach ($randomMovies as $index => $movie) {
                MovieSchedule::create([
                    'show_date' => $date->format('Y-m-d'),
                    'movie_id' => $movie->movie_id,
                    'position' => $index + 1 // Vị trí hiển thị
                ]);
            }
        }
    }
}