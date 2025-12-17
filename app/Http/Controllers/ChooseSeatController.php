<?php

namespace App\Http\Controllers;

use App\Models\Showtime;
use App\Models\SeatLock;
use App\Models\Combo; 
use App\Events\SeatLocked;
use App\Events\SeatUnlocked;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Carbon\Carbon;

class ChooseSeatController extends Controller
{
    /**
     * HIỂN THỊ MÀN HÌNH CHỌN GHẾ
     */
    public function show($showtimeId)
    {
        $showtime = Showtime::with(['movie', 'room.cinema', 'room.seats'])
            ->findOrFail($showtimeId);

        // ✅ FIX: Kiểm tra suất chiếu đã qua giờ chưa
        if (Carbon::parse($showtime->start_time)->isPast()) {
            return redirect()->route('movies.show', $showtime->movie_id)
                ->with('error', 'Suất chiếu này đã bắt đầu. Vui lòng chọn suất khác.');
        }

        // ✅ FIX: Tự động dọn ghế hết hạn TRƯỚC KHI hiển thị
        $this->cleanExpiredLocks($showtimeId);

        // 1. Ghế đã bán
        $soldSeatIds = DB::table('booking_seats')
            ->join('bookings', 'booking_seats.booking_id', '=', 'bookings.booking_id')
            ->where('bookings.showtime_id', $showtimeId)
            ->whereIn('bookings.payment_status', ['confirmed', 'paid']) // ✅ Chỉ lấy vé đã thanh toán
            ->pluck('booking_seats.seat_id')
            ->toArray();

        // 2. Ghế đang bị lock (CẢI THIỆN: Thêm expires_at vào response)
        $userId = Auth::id();
        $sessionId = Session::getId();

        $lockedSeats = SeatLock::where('showtime_id', $showtimeId)
            ->where('expires_at', '>', now())
            ->where(function($q) use ($userId, $sessionId) {
                $q->where('session_id', '!=', $sessionId);
                if ($userId) {
                    $q->where('user_id', '!=', $userId);
                }
            })
            ->get(['seat_id', 'expires_at']);

        $lockedSeatIds = $lockedSeats->pluck('seat_id')->toArray();

        // ✅ Trả thêm thời gian hết hạn để frontend tự động mở khóa
        $lockedSeatsWithExpiry = $lockedSeats->mapWithKeys(function($lock) {
            return [$lock->seat_id => $lock->expires_at->toIso8601String()];
        });

        $mySelectedSeats = SeatLock::where('showtime_id', $showtimeId)
            ->where('expires_at', '>', now())
            ->where(function($q) use ($userId, $sessionId) {
                $q->where('session_id', $sessionId);
                if ($userId) {
                    $q->orWhere('user_id', $userId);
                }
            })
            ->pluck('seat_id')
            ->toArray();

        $combos = Combo::where('is_active', true)->get();

        return Inertia::render('Booking/ChooseSeat', [
            'showtime' => $showtime,
            'movie' => $showtime->movie,
            'room' => $showtime->room,
            'cinema' => $showtime->room->cinema,
            'seats' => $showtime->room->seats,
            'soldSeatIds' => $soldSeatIds,
            'lockedSeatIds' => $lockedSeatIds,
            'lockedSeatsWithExpiry' => $lockedSeatsWithExpiry, // ✅ Để frontend check realtime
            'mySelectedSeatIds' => $mySelectedSeats,
            'combos' => $combos,
        ]);
    }

    /**
     * ✅ HÀM MỚI: Dọn ghế hết hạn
     */
    private function cleanExpiredLocks($showtimeId)
    {
        $expiredLocks = SeatLock::where('showtime_id', $showtimeId)
            ->where('expires_at', '<=', now())
            ->get();

        foreach ($expiredLocks as $lock) {
            $lock->delete();
            // Bắn sự kiện mở khóa cho frontend biết
            SeatUnlocked::dispatch($showtimeId, $lock->seat_id, $lock->user_id, $lock->session_id);
        }
    }

    /**
     * API: KHÓA GHẾ (ĐÃ CẢI THIỆN)
     */
    public function lockSeat(Request $request)
    {
        $showtimeId = $request->showtime_id;
        $seatId = $request->seat_id;
        $userId = Auth::id();
        $sessionId = Session::getId();

        DB::beginTransaction();
        try {
            // ✅ FIX 1: Kiểm tra ghế đã bán chưa (QUAN TRỌNG!)
            $isSold = DB::table('booking_seats')
                ->join('bookings', 'booking_seats.booking_id', '=', 'bookings.booking_id')
                ->where('bookings.showtime_id', $showtimeId)
                ->where('booking_seats.seat_id', $seatId)
                ->whereIn('bookings.payment_status', ['confirmed', 'paid'])
                ->exists();

            if ($isSold) {
                DB::rollBack();
                return response()->json([
                    'status' => 'error', 
                    'message' => 'Ghế này đã được đặt!'
                ], 409);
            }

            // ✅ FIX 2: Khóa dòng (Lock for update) - CHẶN RACE CONDITION
            $existingLock = SeatLock::where('showtime_id', $showtimeId)
                ->where('seat_id', $seatId)
                ->lockForUpdate() // 🔒 Khóa để không ai đọc/ghi được
                ->first();

            // Kiểm tra lock còn hiệu lực không
            if ($existingLock) {
                if ($existingLock->expires_at > now()) {
                    // Nếu người khác đang giữ
                    if ($existingLock->session_id !== $sessionId) {
                        DB::rollBack();
                        return response()->json([
                            'status' => 'error', 
                            'message' => 'Ghế vừa bị người khác chọn!',
                            'locked_by' => 'other'
                        ], 409);
                    }
                } else {
                    // Lock hết hạn -> Xóa đi
                    $existingLock->delete();
                }
            }

            // ✅ FIX 3: Tạo lock mới với thời gian rõ ràng
            $expiresAt = now()->addMinutes(10);
            
            $lock = SeatLock::updateOrCreate(
                [
                    'showtime_id' => $showtimeId, 
                    'seat_id' => $seatId
                ],
                [
                    'user_id' => $userId,
                    'session_id' => $sessionId,
                    'locked_at' => now(),
                    'expires_at' => $expiresAt,
                    'status' => 'active'
                ]
            );
            
            DB::commit();

            // Bắn sự kiện cho tất cả client
            SeatLocked::dispatch($showtimeId, $seatId, $userId, $sessionId);

            return response()->json([
                'status' => 'success',
                'expires_at' => $expiresAt->toIso8601String() // ✅ Trả về thời gian hết hạn
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error', 
                'message' => 'Lỗi hệ thống: ' . $e->getMessage()
            ], 500);
        }
    }

    public function unlockSeat(Request $request)
    {
        $showtimeId = $request->showtime_id;
        $seatId = $request->seat_id;
        $sessionId = Session::getId();
        $userId = Auth::id();

        // Xóa khóa
        SeatLock::where('showtime_id', $showtimeId)
            ->where('seat_id', $seatId)
            ->where(function($query) use ($sessionId, $userId) {
                $query->where('session_id', $sessionId);
                if ($userId) {
                    $query->orWhere('user_id', $userId);
                }
            })
            ->delete();

        // Bắn sự kiện
        SeatUnlocked::dispatch($showtimeId, $seatId, $userId, $sessionId);

        return response()->json(['status' => 'success']);
    }

    /**
     * ✅ API MỚI: Lấy trạng thái ghế realtime (Dùng cho polling)
     */
    public function getSeatStatus($showtimeId)
    {
        $this->cleanExpiredLocks($showtimeId);

        $userId = Auth::id();
        $sessionId = Session::getId();

        $soldSeatIds = DB::table('booking_seats')
            ->join('bookings', 'booking_seats.booking_id', '=', 'bookings.booking_id')
            ->where('bookings.showtime_id', $showtimeId)
            ->whereIn('bookings.status', ['confirmed', 'paid'])
            ->pluck('booking_seats.seat_id')
            ->toArray();

        $lockedSeats = SeatLock::where('showtime_id', $showtimeId)
            ->where('expires_at', '>', now())
            ->where(function($q) use ($userId, $sessionId) {
                $q->where('session_id', '!=', $sessionId);
                if ($userId) {
                    $q->where('user_id', '!=', $userId);
                }
            })
            ->get(['seat_id', 'expires_at']);

        return response()->json([
            'soldSeatIds' => $soldSeatIds,
            'lockedSeatIds' => $lockedSeats->pluck('seat_id'),
            'lockedSeatsWithExpiry' => $lockedSeats->mapWithKeys(function($lock) {
                return [$lock->seat_id => $lock->expires_at->toIso8601String()];
            })
        ]);
    }
}