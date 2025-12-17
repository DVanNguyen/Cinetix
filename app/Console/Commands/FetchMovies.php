<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\TmdbService;

class FetchMovies extends Command
{
    protected $signature = 'app:fetch-movies'; // Tên lệnh để gõ
    protected $description = 'Lấy dữ liệu phim mới từ TMDB';

    public function handle(TmdbService $tmdbService)
    {
        $this->info('Đang bắt đầu lấy dữ liệu từ TMDB...');
        
        try {
            $tmdbService->fetchNowShowingMovies();
            $this->info('Hoàn tất! Đã cập nhật phim mới.');
        } catch (\Exception $e) {
            $this->error('Có lỗi xảy ra: ' . $e->getMessage());
        }
    }
}