<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Cinema;
use App\Models\Room;
use App\Models\Format;
use App\Models\Showtime;
use App\Models\Movie;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CinemaSeeder extends Seeder
{
    public function run()
    {
        // Dữ liệu mẫu bạn cung cấp
        $cinemasData = [
            [
                'name' => 'CGV Vincom Đà Nẵng',
                'address' => 'Tầng 5, Vincom Plaza Ngô Quyền, Sơn Trà, Đà Nẵng',
                'formats' => [
                    [
                        'type' => '2D Phụ Đề',
                        'rooms' => [
                            ['name' => 'Phòng 1', 'seat_count' => 100, 'times' => ['09:00', '11:30', '14:00', '16:30', '19:00', '21:30']],
                            ['name' => 'Phòng 2', 'seat_count' => 100, 'times' => ['10:00', '12:45', '15:30', '18:15', '21:00']],
                            ['name' => 'Phòng 3', 'seat_count' => 80, 'times' => ['09:30', '12:00', '14:30', '17:00', '19:30']]
                        ]
                    ],
                    [
                        'type' => '3D Phụ Đề',
                        'rooms' => [
                            ['name' => 'Phòng 4', 'seat_count' => 120, 'times' => ['13:00', '15:45', '18:30', '21:15']]
                        ]
                    ],
                    [
                        'type' => 'IMAX 2D',
                        'rooms' => [
                            ['name' => 'Phòng IMAX', 'seat_count' => 250, 'times' => ['16:00', '19:00', '22:00']]
                        ]
                    ]
                ]
            ],
            [
                'name' => 'Lotte Cinema Đà Nẵng',
                'address' => '6 Nại Nam, Q.Hải Châu, Đà Nẵng',
                'formats' => [
                    [
                        'type' => '2D Phụ Đề',
                        'rooms' => [
                            ['name' => 'Phòng A', 'seat_count' => 90, 'times' => ['09:15', '11:45', '14:15', '16:45', '19:15']],
                            ['name' => 'Phòng B', 'seat_count' => 90, 'times' => ['10:30', '13:00', '15:30', '18:00', '20:30']]
                        ]
                    ],
                    [
                        'type' => '2D Lồng Tiếng',
                        'rooms' => [
                            ['name' => 'Phòng C', 'seat_count' => 110, 'times' => ['09:00', '12:00', '15:00', '18:00']]
                        ]
                    ]
                ]
            ],
            // ... Bạn có thể copy tiếp Galaxy, Beta, Starlight vào đây tương tự ...
        ];

        // Lấy phim đầu tiên để gán lịch (Dùng phim bạn đã fetch từ TMDB)
        $movie = Movie::first();
        if (!$movie) {
            $this->command->error('Chưa có phim nào trong DB! Hãy chạy fetch-movies trước.');
            return;
        }

        DB::beginTransaction();
        try {
            foreach ($cinemasData as $cData) {
                // 1. Tạo Rạp
                $cinema = Cinema::create([
                    'name' => $cData['name'],
                    'address' => $cData['address'],
                ]);

                foreach ($cData['formats'] as $fData) {
                    // 2. Tạo hoặc lấy Format (VD: 2D Phụ Đề)
                    $format = Format::firstOrCreate(['name' => $fData['type']]);

                    foreach ($fData['rooms'] as $rData) {
                        // 3. Tạo Phòng
                        $room = Room::create([
                            'cinema_id' => $cinema->cinema_id, // Chú ý: dùng cinema_id theo thiết kế của bạn
                            'name' => $rData['name'],
                            'seat_count' => $rData['seat_count']
                        ]);

                        // 4. Tạo Suất Chiếu (Showtimes) cho 3 ngày tới
                        for ($i = 0; $i < 3; $i++) {
                            $date = Carbon::today()->addDays($i);

                            foreach ($rData['times'] as $timeStr) {
                                $startTime = Carbon::parse($date->format('Y-m-d') . ' ' . $timeStr);
                                $endTime = $startTime->copy()->addMinutes($movie->duration + 20); // Phim + 20p dọn

                                Showtime::create([
                                    'movie_id' => $movie->movie_id,
                                    'room_id' => $room->room_id,
                                    'format_id' => $format->format_id,
                                    'start_time' => $startTime,
                                    'end_time' => $endTime,
                                    'price' => str_contains($fData['type'], 'IMAX') ? 180000 : 90000,
                                ]);
                            }
                        }
                    }
                }
            }
            DB::commit();
            $this->command->info('Đã tạo dữ liệu Rạp & Lịch chiếu thành công!');
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error($e->getMessage());
        }
    }
}