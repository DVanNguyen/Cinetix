<?php

namespace App\Services;

use App\Models\Movie;
use App\Models\Genre;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class TmdbService
{
    protected $baseUrl = 'https://api.themoviedb.org/3';
    protected $imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
    protected $backdropBaseUrl = 'https://image.tmdb.org/t/p/w1280';
    protected $apiKey;

    protected $genreMap = [
        'Action'           => 'Hành động',
        'Adventure'        => 'Phiêu lưu',
        'Animation'        => 'Hoạt hình',
        'Comedy'           => 'Hài',
        'Crime'            => 'Hình sự',
        'Documentary'      => 'Tài liệu',
        'Drama'            => 'Tâm lý',
        'Family'           => 'Gia đình',
        'Fantasy'          => 'Giả tưởng',
        'History'          => 'Lịch sử',
        'Horror'           => 'Kinh dị',
        'Music'            => 'Âm nhạc',
        'Mystery'          => 'Bí ẩn',
        'Romance'          => 'Tình cảm',
        'Science Fiction' => 'Khoa học viễn tưởng',
        'TV Movie'         => 'Phim truyền hình',
        'Thriller'         => 'Giật gân',
        'War'              => 'Chiến tranh',
        'Western'          => 'Miền Tây',
    ];

    public function __construct()
    {
        $this->apiKey = env('TMDB_API_KEY');
        if (!$this->apiKey) {
            throw new \Exception('TMDB_API_KEY not set in .env');
        }
    }

    public function fetchNowShowingMovies($page = 1, $maxPages = 15)
    {
        $this->seedStandardGenres();
        $savedCount = 0;

        for ($i = $page; $i < $page + $maxPages; $i++) {
            $response = Http::withoutVerifying()->get("{$this->baseUrl}/movie/now_playing", [
                'api_key'  => $this->apiKey,
                'language' => 'en-US',
                'region'   => 'US',
                'page'     => $i,
            ]);

            if ($response->failed()) continue;

            foreach ($response->json('results', []) as $movie) {
                if ($this->processAndSaveMovie($movie)) {
                    $savedCount++;
                }
            }
        }

        Log::info("Đã lưu {$savedCount} phim mới từ TMDB");
        return $savedCount;
    }

    protected function processAndSaveMovie(array $movie)
    {
        // 1. Trùng TMDB ID → bỏ qua
        if (Movie::where('tmdb_id', $movie['id'])->exists()) {
            return false;
        }

        // 2. Không có backdrop → bỏ qua (giống Java)
        if (empty($movie['backdrop_path'])) {
            return false;
        }

        // 3. Chỉ lấy phim 2025 và 2026 
        $release = $movie['release_date'] ?? '';
        if (!in_array(substr($release, 0, 4), ['2024', '2025', '2026'])) {
            return false;
        }

        // 4. Lấy chi tiết phim
        $detailResp = Http::withoutVerifying()->get("{$this->baseUrl}/movie/{$movie['id']}", [
            'api_key'           => $this->apiKey,
            'language'          => 'en-US',
            'append_to_response' => 'videos,credits',
        ]);

        if ($detailResp->failed()) return false;
        $detail = $detailResp->json();

        // 5. Trailer – giống hệt Java
        $trailerUrl = $this->getBestTrailerLikeJava($detail['videos']['results'] ?? []);
        if (!$trailerUrl) return false;

        // 6. Thời lượng 61-180 phút
        $runtime = $detail['runtime'] ?? 0;
        if ($runtime <= 60 || $runtime > 180) return false;

        // 7. Loại bỏ Documentary (99) và Music (10402)
        $genreId = $this->getValidGenreId($detail['genres'] ?? []);
        if (!$genreId) return false;

        $rating = $this->getRating($detail);

        // 8. Lưu phim
        Movie::updateOrCreate(
            ['tmdb_id' => $movie['id']],
            [
                'title'        => $detail['title'] ?? $movie['original_title'],
                'description'  => $detail['overview'] ?: 'Đang cập nhật...',
                'duration'     => $runtime,
                'release_date' => Carbon::parse($release)->format('Y-m-d'),
                'poster_url'   => $movie['poster_path'] ? $this->imageBaseUrl . $movie['poster_path'] : null,
                'backdrop_url' => $this->backdropBaseUrl . $movie['backdrop_path'],
                'trailer_url'  => $trailerUrl,
                'director'     => $this->getDirector($detail['credits']['crew'] ?? []),
                'cast'         => $this->getCast($detail['credits']['cast'] ?? []),
                'rating'       => $rating,
                'status'       => Carbon::parse($release)->isFuture() ? 'coming_soon' : 'now_showing',
                'genre_id'     => $genreId,
            ]
        );

        return true;
    }

    // TRAILER 
    protected function getBestTrailerLikeJava($videos)
    {
        if (empty($videos)) return null;

        $youtubeVideos = collect($videos)->where('site', 'YouTube');

        if ($youtubeVideos->isEmpty()) return null;

        // Trailer
        $trailer = $youtubeVideos->firstWhere('type', 'Trailer');
        if ($trailer) return "https://www.youtube.com/watch?v=" . $trailer['key'];

        // Teaser
        $teaser = $youtubeVideos->firstWhere('type', 'Teaser');
        if ($teaser) return "https://www.youtube.com/watch?v=" . $teaser['key'];

        // Featurette
        $featurette = $youtubeVideos->firstWhere('type', 'Featurette');
        if ($featurette) return "https://www.youtube.com/watch?v=" . $featurette['key'];

        // Bất kỳ video YouTube nào
        $any = $youtubeVideos->first();
        return $any ? "https://www.youtube.com/watch?v=" . $any['key'] : null;
    }

    protected function getValidGenreId($genres)
    {
        $banned = ['Documentary', 'Music', 'Western', 'History'];

        foreach ($genres as $g) {
            if (in_array($g['name'], $banned)) {    
                return null; // Bo QUA THE LOAI PHIM
            }
        }

        if (empty($genres)) return null;

        $name = $this->genreMap[$genres[0]['name']] ?? $genres[0]['name'];
        return Genre::firstOrCreate(['name' => $name])->genre_id;
    }

    protected function getDirector($crew)
    {
        return collect($crew)->firstWhere('job', 'Director')['name'] ?? 'Đang cập nhật';
    }

    protected function getCast($cast)
    {
        return collect($cast)->take(5)->pluck('name')->join(', ');
    }

    protected function seedStandardGenres()
    {
        foreach ($this->genreMap as $name) {
            Genre::firstOrCreate(['name' => $name]);
        }
    }
    
    protected function getRating($detail)
    {
        $voteAverage = $detail['vote_average'] ?? 0;
        return round((float) $voteAverage, 1); // Format float 1 chữ số thập phân
    }
}