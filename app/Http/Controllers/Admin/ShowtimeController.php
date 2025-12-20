<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MovieSchedule;
use App\Models\Cinema;
use App\Models\Room;
use App\Models\Showtime;
use App\Models\Movie;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class ShowtimeController extends Controller
{
    /**
     * ✅ 1. TRANG HIỂN THỊ TIMELINE
     */
    public function index(Request $request)
    {
        $date = $request->query('date', Carbon::today()->format('Y-m-d'));
        $cinemaId = $request->query('cinema_id');
        
        $cinemas = Cinema::select('cinema_id', 'name', 'address')->get();
        
        if (!$cinemaId && $cinemas->isNotEmpty()) {
            $cinemaId = $cinemas->first()->cinema_id;
        }
        
        $selectedCinema = Cinema::find($cinemaId);
        
        $rooms = [];
        if ($cinemaId) {
            $rooms = Room::where('cinema_id', $cinemaId)
                ->with(['showtimes' => function ($q) use ($date) {
                    $q->whereDate('start_time', $date)
                      ->with('movie:movie_id,title,duration')
                      ->orderBy('start_time');
                }])
                ->orderBy('name')
                ->get();
        }

        return Inertia::render('Admin/ShowtimeScreen', [
            'cinemas' => $cinemas,
            'selectedCinema' => $selectedCinema,
            'rooms' => $rooms,
            'selectedDate' => $date
        ]);
    }

    /**
     * ✅ 2. XẾP LỊCH TỰ ĐỘNG CHO 1 NGÀY
     */
    public function generateAuto(Request $request)
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
            'cinema_id' => 'required|exists:cinemas,cinema_id',
        ]);

        $date = Carbon::parse($request->date);
        $cinemaId = $request->cinema_id;

        try {
            DB::beginTransaction();

            $result = $this->generateScheduleForDate($cinemaId, $date, false);

            DB::commit();

            if ($result['status'] === 'skipped') {
                return back()->with('info', $result['message']);
            }

            return back()->with('success', $result['message']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error generating schedule: ' . $e->getMessage());
            return back()->with('error', 'Lỗi: ' . $e->getMessage());
        }
    }

    /**
     * ✅ 3. XẾP LỊCH TOÀN BỘ (BULK GENERATE)
     */
    public function bulkGenerate(Request $request)
    {
        $request->validate([
            'cinema_id' => 'required|exists:cinemas,cinema_id',
            'start_date' => 'required|date_format:Y-m-d',
            'days' => 'required|integer|min:1|max:30',
            'force_regenerate' => 'boolean'
        ]);

        $startDate = Carbon::parse($request->start_date);
        $cinemaId = $request->cinema_id;
        $days = $request->days;
        $forceRegenerate = $request->force_regenerate ?? false;

        try {
            DB::beginTransaction();
            set_time_limit(300);

            $stats = [
                'created' => 0,
                'updated' => 0,
                'skipped' => 0,
                'errors' => []
            ];

            for ($day = 0; $day < $days; $day++) {
                $currentDate = $startDate->copy()->addDays($day);
                
                try {
                    $result = $this->generateScheduleForDate($cinemaId, $currentDate, $forceRegenerate);
                    
                    if ($result['status'] === 'created') {
                        $stats['created']++;
                    } elseif ($result['status'] === 'updated') {
                        $stats['updated']++;
                    } elseif ($result['status'] === 'skipped') {
                        $stats['skipped']++;
                    }
                } catch (\Exception $e) {
                    $stats['errors'][] = $currentDate->format('d/m/Y') . ': ' . $e->getMessage();
                }
            }

            DB::commit();

            // Tạo thông báo kết quả
            $messages = [];
            if ($stats['created'] > 0) $messages[] = "Tạo mới: {$stats['created']} ngày";
            if ($stats['updated'] > 0) $messages[] = "Cập nhật: {$stats['updated']} ngày";
            if ($stats['skipped'] > 0) $messages[] = "Bỏ qua: {$stats['skipped']} ngày";
            
            $finalMessage = empty($messages) 
                ? "Không có thay đổi nào được thực hiện." 
                : "Xếp lịch toàn bộ thành công! " . implode(", ", $messages);

            if (!empty($stats['errors'])) {
                $finalMessage .= "\n\nMột số lỗi đã xảy ra:\n" . implode("\n", array_slice($stats['errors'], 0, 3));
            }

            return back()->with('success', $finalMessage);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk generate error: ' . $e->getMessage());
            return back()->with('error', 'Lỗi: ' . $e->getMessage());
        }
    }

    /**
     * ✅ 4. HÀM PHỤ: Xếp lịch cho 1 ngày cụ thể
     */
    private function generateScheduleForDate($cinemaId, Carbon $date, $forceRegenerate = false)
    {
        $dateStr = $date->format('Y-m-d');

        // A. Lấy danh sách phòng
        $rooms = Room::where('cinema_id', $cinemaId)->get();
        
        if ($rooms->isEmpty()) {
            throw new \Exception('Rạp này chưa có phòng chiếu!');
        }

        // B. Kiểm tra lịch chiếu hiện tại
        $existingShowtimes = Showtime::whereDate('start_time', $dateStr)
            ->whereHas('room', function($q) use ($cinemaId) {
                $q->where('cinema_id', $cinemaId);
            })
            ->get();

        // C. Lấy danh sách phim từ movie_schedules
        $movieList = MovieSchedule::getListForDate($dateStr);

        if ($movieList->isEmpty()) {
            return [
                'status' => 'skipped',
                'message' => "Không có phim được xếp cho ngày {$date->format('d/m/Y')}"
            ];
        }

        // D. So sánh phim cũ và mới
        $existingMovieIds = $existingShowtimes->pluck('movie_id')->unique()->sort()->values();
        $newMovieIds = $movieList->pluck('movie_id')->sort()->values();
        $hasChanges = $existingMovieIds->toArray() !== $newMovieIds->toArray();
        // E. Logic xử lý
        if ($existingShowtimes->isNotEmpty()) {
            if (!$forceRegenerate && !$hasChanges) {
                // Đã có lịch + Không force + Phim không đổi → Bỏ qua
                return [
                    'status' => 'skipped',
                    'message' => "Ngày {$date->format('d/m/Y')} đã có lịch chiếu"
                ];
            }

            if ($forceRegenerate || $hasChanges) {
                // Kiểm tra vé đã bán
                $hasBookings = DB::table('bookings')
                    ->whereIn('showtime_id', $existingShowtimes->pluck('showtime_id'))
                    ->where('payment_status', 'paid')
                    ->exists();

                if ($hasBookings) {
                    return [
                        'status' => 'skipped',
                        'message' => "Không thể cập nhật ngày {$date->format('d/m/Y')} (đã có vé bán)"
                    ];
                }

                // Xóa lịch cũ
                Showtime::whereIn('showtime_id', $existingShowtimes->pluck('showtime_id'))->delete();
                $resultStatus = 'updated';
            }
        } else {
            $resultStatus = 'created';
        }

        // F. Tạo lịch chiếu mới
        $this->createShowtimesForDate($rooms, $movieList, $date);

        return [
            'status' => $resultStatus,
            'message' => $resultStatus === 'created' 
                ? "Tạo lịch thành công cho ngày {$date->format('d/m/Y')}"
                : "Cập nhật lịch thành công cho ngày {$date->format('d/m/Y')}"
        ];
    }

    /**
     * ✅ 5. HÀM PHỤ: Tạo suất chiếu cho phòng
     */
    private function createShowtimesForDate($rooms, $movieList, Carbon $date)
    {
        $cleanTime = 15; // Phút dọn phòng
        $openHour = 8;
        $closeHour = 2; // 2:00 AM hôm sau

        foreach ($rooms as $roomIndex => $room) {
            $current = $date->copy()->setHour($openHour)->minute(0)->second(0);
            $movieIndex = $roomIndex;

            while (true) {
                $movie = $movieList[$movieIndex % $movieList->count()];

                $start = $current->copy();
                $end = $start->copy()->addMinutes($movie->duration);

                // Dừng nếu suất kết thúc sau 2:00 AM hôm sau
                $maxTime = $date->copy()->addDay()->setHour($closeHour)->minute(0);
                if ($end->copy()->addMinutes($cleanTime)->gt($maxTime)) {
                    break;
                }

                // Xác định format & giá vé
                $roomName = strtoupper($room->name);
                $isIMAX = str_contains($roomName, 'IMAX');
                $formatId = $isIMAX ? 5 : 1;

                $price = 90000;
                if ($isIMAX) $price += 70000;
                if ($date->isWeekend()) $price += 20000;
                if ($start->hour >= 18) $price += 15000;

                // Tạo suất chiếu
                Showtime::create([
                    'movie_id' => $movie->movie_id,
                    'room_id' => $room->room_id,
                    'format_id' => $formatId,
                    'start_time' => $start,
                    'end_time' => $end,
                    'price' => $price,
                ]);

                $current = $end->addMinutes($cleanTime);
                $movieIndex++;
            }
        }
    }

    /**
     * ✅ 6. XÓA SUẤT CHIẾU
     */
    public function destroy($id)
    {
        try {
            $showtime = Showtime::findOrFail($id);
            
            // Kiểm tra vé đã bán
            $hasBookings = DB::table('bookings')
                ->where('showtime_id', $id)
                ->where('payment_status', 'paid')
                ->exists();
            
            if ($hasBookings) {
                return back()->with('error', 'Không thể xóa suất chiếu đã có người đặt vé!');
            }

            // Kiểm tra xem có booking pending không (optional - có thể xóa luôn)
            $hasPendingBookings = DB::table('bookings')
                ->where('showtime_id', $id)
                ->where('payment_status', 'pending')
                ->exists();

            if ($hasPendingBookings) {
                // Xóa cả bookings pending
                DB::table('bookings')
                    ->where('showtime_id', $id)
                    ->where('payment_status', 'pending')
                    ->delete();
            }
            
            $showtime->delete();
            
            return back()->with('success', 'Đã xóa suất chiếu thành công.');
            
        } catch (\Exception $e) {
            Log::error('Error deleting showtime: ' . $e->getMessage());
            return back()->with('error', 'Lỗi khi xóa suất chiếu: ' . $e->getMessage());
        }
    }

    /**
     * ✅ 7. XÓA NHIỀU SUẤT CHIẾU (BULK DELETE)
     */
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'showtime_ids' => 'required|array',
            'showtime_ids.*' => 'exists:showtimes,showtime_id'
        ]);

        try {
            DB::beginTransaction();

            $showtimeIds = $request->showtime_ids;

            // Kiểm tra vé đã bán
            $hasBookings = DB::table('bookings')
                ->whereIn('showtime_id', $showtimeIds)
                ->where('payment_status', 'paid')
                ->exists();

            if ($hasBookings) {
                DB::rollBack();
                return back()->with('error', 'Một số suất chiếu đã có người đặt vé, không thể xóa!');
            }

            // Xóa bookings pending
            DB::table('bookings')
                ->whereIn('showtime_id', $showtimeIds)
                ->where('payment_status', 'pending')
                ->delete();

            // Xóa showtimes
            $deleted = Showtime::whereIn('showtime_id', $showtimeIds)->delete();

            DB::commit();

            return back()->with('success', "Đã xóa {$deleted} suất chiếu.");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk delete error: ' . $e->getMessage());
            return back()->with('error', 'Lỗi: ' . $e->getMessage());
        }
    }

    /**
     * ✅ 8. XÓA TẤT CẢ SUẤT CHIẾU CỦA 1 NGÀY (Có kiểm tra vé)
     */
    public function clearDay(Request $request)
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
            'cinema_id' => 'required|exists:cinemas,cinema_id'
        ]);

        try {
            DB::beginTransaction();

            $showtimes = Showtime::whereDate('start_time', $request->date)
                ->whereHas('room', function($q) use ($request) {
                    $q->where('cinema_id', $request->cinema_id);
                })
                ->get();

            if ($showtimes->isEmpty()) {
                return back()->with('info', 'Không có suất chiếu nào trong ngày này.');
            }

            // Kiểm tra vé đã bán
            $hasBookings = DB::table('bookings')
                ->whereIn('showtime_id', $showtimes->pluck('showtime_id'))
                ->where('payment_status', 'paid')
                ->exists();

            if ($hasBookings) {
                DB::rollBack();
                return back()->with('error', 'Không thể xóa vì đã có vé được bán trong ngày này!');
            }

            // Xóa bookings pending
            DB::table('bookings')
                ->whereIn('showtime_id', $showtimes->pluck('showtime_id'))
                ->where('payment_status', 'pending')
                ->delete();

            // Xóa showtimes
            $deleted = Showtime::whereIn('showtime_id', $showtimes->pluck('showtime_id'))->delete();

            DB::commit();

            return back()->with('success', "Đã xóa {$deleted} suất chiếu trong ngày {$request->date}.");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Clear day error: ' . $e->getMessage());
            return back()->with('error', 'Lỗi: ' . $e->getMessage());
        }
    }

    /**
     * ✅ 9. KIỂM TRA THAY ĐỔI PHIM (API cho frontend)
     */
    public function checkChanges(Request $request)
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
            'cinema_id' => 'required|exists:cinemas,cinema_id'
        ]);

        $dateStr = $request->date;
        $cinemaId = $request->cinema_id;

        // Lấy phim hiện tại trong lịch chiếu
        $currentMovies = Showtime::whereDate('start_time', $dateStr)
            ->whereHas('room', function($q) use ($cinemaId) {
                $q->where('cinema_id', $cinemaId);
            })
            ->with('movie:movie_id,title')
            ->get()
            ->pluck('movie.title', 'movie_id')
            ->unique();

        // Lấy phim trong movie_schedules
        $scheduledMovies = MovieSchedule::getListForDate($dateStr)
            ->mapWithKeys(fn($m) => [$m->movie_id => $m->title]);

        $hasChanges = $currentMovies->keys()->sort()->values()->toArray() 
                   !== $scheduledMovies->keys()->sort()->values()->toArray();

        // Kiểm tra có thể regenerate không
        $canRegenerate = !DB::table('bookings')
            ->whereHas('showtime', function($q) use ($dateStr, $cinemaId) {
                $q->whereDate('start_time', $dateStr)
                  ->whereHas('room', fn($r) => $r->where('cinema_id', $cinemaId));
            })
            ->where('payment_status', 'paid')
            ->exists();

        return response()->json([
            'has_changes' => $hasChanges,
            'current_movies' => $currentMovies->values(),
            'scheduled_movies' => $scheduledMovies->values(),
            'can_regenerate' => $canRegenerate
        ]);
    }
}