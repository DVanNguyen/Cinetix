<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Movie;
use App\Models\Showtime;
use Carbon\Carbon;

class ShowController extends Controller
{
    public function show(Request $request, $movieId)
    {
        $date = $request->query('date', Carbon::today()->format('Y-m-d'));

        $movie = Movie::with('genre')->findOrFail($movieId);

        // ✅ FIX: Lấy thời gian hiện tại với timezone chính xác
        $now = Carbon::now();
        $selectedDate = Carbon::parse($date)->startOfDay();
        $isToday = $selectedDate->isToday();

        // ✅ Lấy suất chiếu và lọc theo thời gian
        $showtimes = Showtime::where('movie_id', $movieId)
            ->whereDate('start_time', $date)
            ->with(['room.cinema', 'format'])
            ->orderBy('start_time')
            ->get()
            // ✅ FIX: Lọc ở application layer để chính xác hơn
            ->filter(function($showtime) use ($now, $isToday) {
                if (!$isToday) return true; // Không phải hôm nay → giữ tất cả
                
                $startTime = Carbon::parse($showtime->start_time);
                // ✅ Chỉ hiển thị suất chiếu bắt đầu SAU thời điểm hiện tại ít nhất 15 phút
                return $now->diffInMinutes($startTime, false) > 15;
            });

        // Gom nhóm dữ liệu: Rạp -> Định dạng -> Phòng -> Suất chiếu
        $cinemas = [];

        foreach ($showtimes as $st) {
            if (!$st->room || !$st->room->cinema) continue;

            $cinema = $st->room->cinema;
            $room = $st->room;
            
            $formatId = $st->format ? $st->format->format_id : 0;
            $formatName = $st->format ? $st->format->name : '2D Standard';

            if (!isset($cinemas[$cinema->cinema_id])) {
                $cinemas[$cinema->cinema_id] = [
                    'id' => $cinema->cinema_id,
                    'name' => $cinema->name,
                    'address' => $cinema->address,
                    'distance' => "2.5 km",
                    'formats' => []
                ];
            }

            if (!isset($cinemas[$cinema->cinema_id]['formats'][$formatId])) {
                $cinemas[$cinema->cinema_id]['formats'][$formatId] = [
                    'type' => $formatName,
                    'rooms' => []
                ];
            }

            if (!isset($cinemas[$cinema->cinema_id]['formats'][$formatId]['rooms'][$room->room_id])) {
                $cinemas[$cinema->cinema_id]['formats'][$formatId]['rooms'][$room->room_id] = [
                    'name' => $room->name,
                    'showtimes' => []
                ];
            }

            // ✅ Trả đầy đủ thông tin để frontend có thể validate thêm
            $cinemas[$cinema->cinema_id]['formats'][$formatId]['rooms'][$room->room_id]['showtimes'][] = [
                'id' => $st->showtime_id,
                'time' => Carbon::parse($st->start_time)->format('H:i'),
                'price' => number_format($st->price) . 'đ',
                'start_time' => $st->start_time, // ✅ Full ISO datetime
                'timestamp' => Carbon::parse($st->start_time)->timestamp // ✅ Unix timestamp
            ];
        }

        // Reset keys của array
        $cinemas = array_values(array_map(function($cinema) {
            $cinema['formats'] = array_values(array_map(function($format) {
                $format['rooms'] = array_values($format['rooms']);
                return $format;
            }, $cinema['formats']));
            return $cinema;
        }, $cinemas));

        return Inertia::render('Movies/Show', [
            'movie' => $movie,
            'cinemas' => $cinemas,
            'selectedDate' => $date,
            'currentTime' => $now->toIso8601String() // ✅ Trả về server time để sync
        ]);
    }
}