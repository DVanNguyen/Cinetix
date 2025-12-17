<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MovieSchedule extends Model
{
    use HasFactory;

    protected $table = 'movie_schedules';
    protected $fillable = ['show_date', 'movie_id', 'position'];

    public function movie()
    {
        return $this->belongsTo(Movie::class, 'movie_id', 'movie_id');
    }

    /**
     * --- HÀM QUAN TRỌNG ĐỂ "RÃ ĐÔNG" ---
     * Lấy danh sách phim của 1 ngày cụ thể
     */
    public static function getListForDate($date)
    {
        return self::with('movie')              // 1. Kèm thông tin phim
            ->where('show_date', $date)         // 2. Lọc đúng ngày
            ->orderBy('position', 'asc')        // 3. Sắp xếp theo vị trí admin đã xếp
            ->get()                             // 4. Lấy dữ liệu
            ->pluck('movie')                    // 5. Chỉ lấy cục 'movie', bỏ cục 'schedule'
            ->filter()                          // 6. Lọc bỏ null (phòng khi phim bị xóa mà lịch còn)
            ->unique('movie_id')                // 7. Chống trùng lặp
            ->values();                         // 8. Reset lại key mảng cho React dễ đọc
    }
}