<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Http;
use App\Models\Booking;
use App\Models\BookingSeat;
use App\Models\SeatLock;
use App\Models\Showtime;
use App\Models\Seat;
use App\Models\Combo;
use App\Models\Payment;
use App\Models\WalletTransaction;

class PaymentController extends Controller
{
    // CẤU HÌNH MOMO
    private $momoEndpoint = "https://test-payment.momo.vn/v2/gateway/api/create";
    private $partnerCode = "MOMO"; 
    private $accessKey = "F8BBA842ECF85"; 
    private $secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";

    /**
     * ✅ 1. HIỂN THỊ TRANG THANH TOÁN (có thêm số dư ví)
     */
    public function index(Request $request)
    {
        $showtimeId = $request->showtime_id;
        $seatIds = $request->seat_ids ? explode(',', $request->seat_ids) : [];
        
        $showtime = Showtime::with(['movie', 'room.cinema'])->findOrFail($showtimeId);
        $seats = Seat::whereIn('seat_id', $seatIds)->get();

        // Tính tiền ghế
        $seatTotal = 0;
        $seatDetails = [];
        foreach ($seats as $seat) {
            $price = 90000; 
            if ($seat->seat_type === 'vip') $price = 120000;
            if ($seat->seat_type === 'couple') $price = 240000;
            $seatTotal += $price;

            $seatDetails[] = [
                'seat_id' => $seat->seat_id,
                'seat_code' => $seat->seat_row . $seat->seat_number,
                'type' => $seat->seat_type,
                'price' => $price
            ];
        }

        // Tính tiền Combo
        $comboString = $request->input('combos', ''); 
        $selectedCombos = [];
        $combosTotal = 0;

        if (!empty($comboString)) {
            $pairs = explode(',', $comboString);
            foreach ($pairs as $pair) {
                if (strpos($pair, ':') !== false) {
                    [$id, $qty] = explode(':', $pair);
                    $combo = Combo::find($id);
                    if ($combo) {
                        $total = $combo->price * $qty;
                        $combosTotal += $total;
                        $selectedCombos[] = [
                            'combo_id' => $combo->combo_id,
                            'name' => $combo->name,
                            'quantity' => $qty,
                            'price' => $combo->price,
                            'total' => $total
                        ];
                    }
                }
            }
        }

        $finalTotal = $seatTotal + $combosTotal;

        /** @var \App\Models\User */
        $user = Auth::user();

        return Inertia::render('Booking/Payment', [
            'showtime' => $showtime,
            'seats' => $seatDetails,
            'combos' => $selectedCombos,
            'totalAmount' => $finalTotal,
            'user' => [
                'user_id' => $user->user_id,
                'name' => $user->name,
                'email' => $user->email,
                'wallet_balance' => $user->wallet_balance, // ✅ Thêm số dư ví
                'formatted_wallet_balance' => $user->formatted_wallet_balance
            ]
        ]); 
    }

    /**
     * ✅ 2. XỬ LÝ THANH TOÁN (Có thêm phương thức Ví Xu)
     */
    public function process(Request $request)
    {
        $request->validate([
            'showtime_id' => 'required',
            'seat_ids' => 'required|array',
            'payment_method' => 'required|in:momo,wallet,cash', // ✅ Thêm wallet
            'combos' => 'nullable|array'
        ]);

        /** @var \App\Models\User */
        $user = Auth::user();
        $userId = $user->user_id;
        $sessionId = Session::getId();
        $seatIds = $request->seat_ids;

        DB::beginTransaction();
        try {
            // 1. Kiểm tra lock ghế
            $validLocks = SeatLock::whereIn('seat_id', $seatIds)
                ->where('showtime_id', $request->showtime_id)
                ->where('session_id', $sessionId)
                ->count();

            if ($validLocks !== count($seatIds)) {
                return response()->json([
                    'status' => 'error', 
                    'message' => 'Hết thời gian giữ ghế hoặc ghế đã bị người khác lấy!'
                ], 400);
            }

            // 2. Tính toán tổng tiền
            $totalAmount = 0;
            $seats = Seat::whereIn('seat_id', $seatIds)->get();
            $bookingSeatsData = [];
            
            foreach ($seats as $seat) {
                $price = 90000;
                if ($seat->seat_type === 'vip') $price = 120000;
                if ($seat->seat_type === 'couple') $price = 240000;
                $totalAmount += $price;
                $bookingSeatsData[] = ['seat_id' => $seat->seat_id, 'price' => $price];
            }

            $bookingCombosData = [];
            if ($request->has('combos')) {
                foreach ($request->combos as $c) {
                    $combo = Combo::find($c['combo_id']);
                    if ($combo) {
                        $subTotal = $combo->price * $c['quantity'];
                        $totalAmount += $subTotal;
                        $bookingCombosData[] = [
                            'combo_id' => $combo->combo_id,
                            'quantity' => $c['quantity'],
                            'price_at_booking' => $combo->price
                        ];
                    }
                }
            }

            // 3. ✅ XỬ LÝ THANH TOÁN BẰNG VÍ XU
            if ($request->payment_method === Booking::PAYMENT_WALLET) {
                // Kiểm tra số dư
                if (!$user->hasEnoughBalance($totalAmount)) {
                    DB::rollBack();
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Số dư ví không đủ. Vui lòng nạp thêm hoặc chọn phương thức khác.'
                    ], 400);
                }

                // Tạo booking
                $booking = $this->createBooking($userId, $request->showtime_id, $totalAmount, $request->payment_method);
                
                // Lưu chi tiết
                $this->saveBookingDetails($booking, $bookingSeatsData, $bookingCombosData);

                // Trừ tiền ví
                $user->deductFromWallet(
                    $totalAmount,
                    WalletTransaction::TYPE_PAYMENT,
                    "Thanh toán vé phim #{$booking->booking_id}",
                    $booking->booking_id,
                    'booking_payment',
                    $booking->booking_id
                );

                // Cập nhật booking thành công
                $booking->update([
                    'payment_status' => 'paid',
                    'status' => Booking::STATUS_CONFIRMED
                ]);

                // Xóa lock ghế
                SeatLock::whereIn('seat_id', $seatIds)
                    ->where('showtime_id', $request->showtime_id)
                    ->delete();

                DB::commit();

                return response()->json([
                    'status' => 'success',
                    'booking_id' => $booking->booking_id,
                    'message' => 'Thanh toán thành công bằng Ví Xu'
                ]);
            }

            // 4. Tạo booking PENDING cho Momo và Cash
            $booking = $this->createBooking($userId, $request->showtime_id, $totalAmount, $request->payment_method);
            $this->saveBookingDetails($booking, $bookingSeatsData, $bookingCombosData);
            SeatLock::whereIn('seat_id', $seatIds)->where('showtime_id', $request->showtime_id)->delete();

            DB::commit();

            // 5. MOMO
            if ($request->payment_method === Booking::PAYMENT_MOMO) {
                $paymentUrl = $this->createMomoUrl($booking);
                return response()->json(['status' => 'redirect', 'url' => $paymentUrl]);
            }

            // 6. CASH (Tiền mặt)
            if ($request->payment_method === Booking::PAYMENT_CASH) {
                // ✅ GIỮ TRẠNG THÁI PENDING, sẽ xử lý sau
                return response()->json([
                    'status' => 'success', 
                    'booking_id' => $booking->booking_id,
                    'message' => 'Vui lòng thanh toán tại quầy trước giờ chiếu'
                ]);
            }

            return response()->json(['status' => 'success', 'booking_id' => $booking->booking_id]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * ✅ HÀM PHỤ: Tạo booking
     */
    private function createBooking($userId, $showtimeId, $totalAmount, $paymentMethod)
    {
        return Booking::create([
            'user_id' => $userId,
            'showtime_id' => $showtimeId,
            'total_amount' => $totalAmount,
            'final_total' => $totalAmount,
            'payment_method' => $paymentMethod,
            'payment_status' => 'pending',
            'status' => Booking::STATUS_PENDING,
            'booking_date' => now(),
        ]);
    }

    /**
     * ✅ HÀM PHỤ: Lưu chi tiết booking
     */
    private function saveBookingDetails($booking, $bookingSeatsData, $bookingCombosData)
    {
        foreach ($bookingSeatsData as $data) {
            BookingSeat::create([
                'booking_id' => $booking->booking_id,
                'seat_id' => $data['seat_id'],
                'price' => $data['price']
            ]);
        }

        foreach ($bookingCombosData as $data) {
            DB::table('booking_combos')->insert([
                'booking_id' => $booking->booking_id,
                'combo_id' => $data['combo_id'],
                'quantity' => $data['quantity'],
                'price_at_booking' => $data['price_at_booking'],
                'created_at' => now()
            ]);
        }
    }

    /**
     * ✅ 3. TẠO URL MOMO (Giữ nguyên)
     */
    private function createMomoUrl($booking) 
    {
        $orderId = $booking->booking_id . '_' . time();
        $requestId = $orderId;
        $amount = (string)$booking->total_amount;
        $orderInfo = "Thanh toán vé phim #" . $booking->booking_id;
        $redirectUrl = route('payment.return');
        $ipnUrl = route('payment.return');
        $extraData = "";

        $rawHash = "accessKey=" . $this->accessKey . 
                   "&amount=" . $amount . 
                   "&extraData=" . $extraData . 
                   "&ipnUrl=" . $ipnUrl . 
                   "&orderId=" . $orderId . 
                   "&orderInfo=" . $orderInfo . 
                   "&partnerCode=" . $this->partnerCode . 
                   "&redirectUrl=" . $redirectUrl . 
                   "&requestId=" . $requestId . 
                   "&requestType=captureWallet";

        $signature = hash_hmac("sha256", $rawHash, $this->secretKey);

        $data = [
            'partnerCode' => $this->partnerCode,
            'partnerName' => "Cinema Booking",
            'storeId' => "MomoTestStore",
            'requestId' => $requestId,
            'amount' => $amount,
            'orderId' => $orderId,
            'orderInfo' => $orderInfo,
            'redirectUrl' => $redirectUrl,
            'ipnUrl' => $ipnUrl,
            'lang' => 'vi',
            'extraData' => $extraData,
            'requestType' => "captureWallet",
            'signature' => $signature
        ];

        Payment::create([
            'booking_id' => $booking->booking_id,
            'amount' => $booking->total_amount,
            'provider' => 'MOMO',
            'transaction_code' => $orderId,
            'status' => 'pending'
        ]);

        $response = Http::post($this->momoEndpoint, $data);
        return $response->json()['payUrl'];
    }

    /**
     * ✅ 4. XỬ LÝ RETURN TỪ MOMO
     */
    public function paymentReturn(Request $request)
    {
        $resultCode = $request->resultCode;
        $orderId = $request->orderId;
        
        $parts = explode('_', $orderId);
        $bookingId = $parts[0];

        $booking = Booking::find($bookingId);
        $payment = Payment::where('transaction_code', $orderId)->first();

        if ($resultCode == 0) {
            DB::transaction(function () use ($booking, $payment) {
                if ($booking) {
                    $booking->update([
                        'payment_status' => 'paid',
                        'status' => Booking::STATUS_CONFIRMED,
                        'payment_id' => $payment ? $payment->payment_id : null
                    ]);
                }
                if ($payment) {
                    $payment->update(['status' => 'success']);
                }
            });

            return redirect()->to('/payment/result?status=success&booking_id=' . $bookingId);
        } else {
            if ($payment) {
                $payment->update(['status' => 'failed']);
            }
            // ✅ Có thể giải phóng ghế ở đây nếu muốn
            return redirect()->to('/payment/result?status=failed&message=' . $request->message);
        }
    }
    
    /**
     * ✅ 5. HIỂN THỊ KẾT QUẢ
     */
    public function result(Request $request) 
    {
        return Inertia::render('Booking/Result', [
            'status' => $request->status,
            'booking_id' => $request->booking_id,
            'message' => $request->message
        ]);
    }
}