<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Room;
use App\Models\Seat;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SeatSeeder extends Seeder
{
    public function run()
    {
        // 1. Tắt khóa ngoại để xóa dữ liệu cũ
        Schema::disableForeignKeyConstraints();
        DB::table('seats')->truncate();
        Schema::enableForeignKeyConstraints();

        $rooms = Room::all();

        foreach ($rooms as $room) {
            $totalSeats = $room->seat_count; // Ví dụ: 140 ghế
            
            // Tính số cột (ghế/hàng)
            $cols = 10;
            if ($totalSeats > 120) $cols = 12;
            if ($totalSeats > 160) $cols = 16;

            // Tính số hàng
            $rows = ceil($totalSeats / $cols);
            $rowLabels = range('A', 'Z'); 

            $createdCount = 0;
            for ($r = 0; $r < $rows; $r++) {
                if (!isset($rowLabels[$r])) break; 
                $currentRowChar = $rowLabels[$r]; // A, B, C...

                for ($c = 1; $c <= $cols; $c++) {
                    if ($createdCount >= $totalSeats) break;

                    // Logic loại ghế (VIP ở giữa)
                    $type = 'standard'; // Giá trị enum trong DB của bạn
                    if ($r >= 2 && $r < $rows - 1) {
                        $type = 'vip';
                    } elseif ($r == $rows - 1) {
                        $type = 'couple';
                    }

                    // TẠO GHẾ (Khớp chính xác với ảnh DB bạn gửi)
                    Seat::create([
                        'room_id'     => $room->room_id,
                        'seat_row'    => $currentRowChar, // Khớp với cột seat_row
                        'seat_number' => $c,
                        'seat_type'   => $type,           // Khớp với cột seat_type
                        // Đã xóa dòng 'status' vì bảng không có
                    ]);

                    $createdCount++;
                }
            }
            echo "Đã tạo $createdCount ghế cho phòng ID: " . $room->room_id . "\n";
        }
    }
}