<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Genre;

class GenreSeeder extends Seeder
{

    protected $primaryKey = 'genre_id';
    public function run()
    {
        // 10 Thể loại phổ biến nhất tại rạp Việt Nam
        $popularGenres = [
            'Hành động',
            'Phiêu lưu',
            'Hoạt hình',
            'Hài',
            'Kinh dị',
            'Tình cảm', // Hoặc 'Lãng mạn' tùy data TMDB trả về
            'Khoa học viễn tưởng',
            'Tâm lý', // Chính kịch
            'Gia đình',
            'Thần thoại' // Hoặc 'Bí ẩn'
        ];

        foreach ($popularGenres as $name) {
            Genre::firstOrCreate(['name' => $name]);
        }
    }
}