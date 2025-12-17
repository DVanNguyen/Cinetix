<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MovieSchedule;
use App\Models\Room;
use App\Models\Showtime;
use App\Models\Movie;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ShowtimeController extends Controller
{
    /**
     * 1. TRANG HIỂN THỊ TIMELINE (Giao diện Admin xem lịch chiếu)
     */
    public function index(Request $request)
    {
        $date = $request->query('date', Carbon::today()->format('Y-m-d'));
        
        // Lấy danh sách phòng và suất chiếu của ngày đó
        $rooms = Room::with(['showtimes' => function ($q) use ($date) {
            $q->whereDate('start_time', $date)
              ->with('movie') // Eager load phim để hiện tên
              ->orderBy('start_time');
        }])->get();

        return Inertia::render('Admin/ShowtimeScreen', [
            'rooms' => $rooms,
            'selectedDate' => $date
        ]);
    }

    /**
     * 2. XẾP LỊCH TỰ ĐỘNG (LOGIC CHÍNH BẠN YÊU CẦU)
     * Chỉ lấy phim từ bảng movie_schedules -> Xếp vào Timeline
     */
    public function generateAuto(Request $request)
    {
        // Validate ngày bắt đầu (mặc định là hôm nay nếu không gửi lên)
        $request->validate(['date' => 'nullable|date_format:Y-m-d']);
        $startDate = $request->date ? Carbon::parse($request->date) : Carbon::today();

        try {
            DB::beginTransaction();
            set_time_limit(300); // Tăng thời gian chạy PHP lên 5 phút để tránh timeout

            $rooms = Room::all();
            $cleanTime = 15; // Thời gian dọn vệ sinh
            $openHour = 9;   // Giờ mở cửa rạp (9:00 sáng)
            $daysCreated = 0;

            // Chạy vòng lặp cho 14 ngày tới
            for ($day = 0; $day < 14; $day++) {
                $currentDate = $startDate->copy()->addDays($day);
                $dateStr = $currentDate->format('Y-m-d');

                // A. AN TOÀN: Nếu ngày này ĐÃ CÓ lịch chiếu -> Bỏ qua (Không ghi đè vé đã bán)
                if (Showtime::whereDate('start_time', $dateStr)->exists()) {
                    continue; 
                }

                // B. NGUYÊN LIỆU: Lấy 7 phim Admin đã chọn cho ngày này
                $movieList = MovieSchedule::getListForDate($dateStr);

                if ($movieList->isEmpty()) {
                    // Nếu Admin chưa xếp phim cho ngày này -> Bỏ qua
                    continue; 
                }

                // C. XẾP LỊCH CHO TỪNG PHÒNG
                foreach ($rooms as $roomIndex => $room) {
                    // Bắt đầu từ giờ mở cửa
                    $current = $currentDate->copy()->setHour($openHour)->minute(0)->second(0);
                    
                    // Logic Xoay tua: Phòng 1 chiếu phim 1, Phòng 2 chiếu phim 2... 
                    // Để khách đến rạp giờ nào cũng có nhiều lựa chọn
                    $movieIndex = $roomIndex; 

                    while (true) {
                        // Lấy phim theo vòng tròn (Round Robin)
                        $movie = $movieList[$movieIndex % $movieList->count()];

                        $start = $current->copy();
                        $end = $start->copy()->addMinutes($movie->duration);

                        // Dừng nếu suất chiếu kết thúc quá muộn (ví dụ sau 1h sáng hôm sau)
                        // Hoặc đơn giản là quá 23:59 cùng ngày
                        if ($end->copy()->addMinutes($cleanTime)->gt($currentDate->copy()->addDay()->setHour(1)->minute(0))) {
                            break;
                        }

                        // D. XỬ LÝ FORMAT & GIÁ VÉ
                        $roomName = strtoupper($room->name);
                        $isIMAX = str_contains($roomName, 'IMAX');
                        
                        // Định dạng: 1=2D, 5=IMAX (Theo DB của bạn)
                        $formatId = $isIMAX ? 5 : 1; 

                        // Tính giá vé động
                        $price = 90000; // Giá gốc
                        if ($isIMAX) $price += 70000; // Phụ thu IMAX
                        if ($currentDate->isWeekend()) $price += 20000; // Phụ thu cuối tuần
                        if ($start->hour >= 18) $price += 15000; // Phụ thu giờ vàng

                        // Tạo suất chiếu
                        Showtime::create([
                            'movie_id' => $movie->movie_id,
                            'room_id' => $room->room_id,
                            'format_id' => $formatId,
                            'start_time' => $start,
                            'end_time' => $end,
                            'price' => $price,
                            'status' => 'active' // Mặc định là đang bán
                        ]);

                        // Cộng thời gian phim + vệ sinh để tính suất tiếp theo
                        $current = $end->addMinutes($cleanTime);
                        $movieIndex++; // Chuyển sang phim tiếp theo trong danh sách
                    }
                }
                $daysCreated++;
            }

            DB::commit();
            return back()->with('success', "Đã xếp lịch tự động thành công cho $daysCreated ngày!");

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Lỗi hệ thống: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 3. SỬA/XÓA THỦ CÔNG (Nếu Admin muốn chỉnh sửa nhỏ sau khi Auto)
     */
    public function store(Request $request)
    {
        // Hàm này dành cho việc kéo thả sửa giờ chiếu cụ thể trên Timeline (nếu cần sau này)
        // Hiện tại để trống hoặc xử lý update đơn giản
        return back();
    }

    public function destroy($id)
    {
        Showtime::findOrFail($id)->delete();
        return back()->with('success', 'Đã xóa suất chiếu.');
    }
}