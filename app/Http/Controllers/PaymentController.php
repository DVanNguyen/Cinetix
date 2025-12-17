<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Http; // Import HTTP Client
use App\Models\Booking;
use App\Models\BookingSeat;
use App\Models\SeatLock;
use App\Models\Showtime;
use App\Models\Seat;
use App\Models\Combo;
use App\Models\Payment; // Import Model Payment (Bảng payments)

class PaymentController extends Controller
{
    // CẤU HÌNH MOMO TEST (Nên đưa vào file .env trong thực tế)
    private $momoEndpoint = "https://test-payment.momo.vn/v2/gateway/api/create";
    private $partnerCode = "MOMO"; 
    private $accessKey = "F8BBA842ECF85"; 
    private $secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz"; 

    // 1. HIỂN THỊ TRANG THANH TOÁN
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

        return Inertia::render('Booking/Payment', [
            'showtime' => $showtime,
            'seats' => $seatDetails,
            'combos' => $selectedCombos,
            'totalAmount' => $finalTotal,
            'user' => Auth::user()
        ]); 
    }

    // 2. XỬ LÝ THANH TOÁN & TẠO URL MOMO
    public function process(Request $request)
    {
        $request->validate([
            'showtime_id' => 'required',
            'seat_ids' => 'required|array',
            'payment_method' => 'required',
            'combos' => 'nullable|array'
        ]);

        $userId = Auth::id();
        $sessionId = Session::getId();
        $seatIds = $request->seat_ids;

        DB::beginTransaction();
        try {
            // Check ghế
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

            // Tính toán lại tổng tiền (Server Side)
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

            // A. TẠO BOOKING (Trạng thái PENDING)
            $booking = Booking::create([
                'user_id' => $userId,
                'showtime_id' => $request->showtime_id,
                'total_amount' => $totalAmount,
                'final_total' => $totalAmount, // Nếu có voucher thì trừ ở đây
                'payment_method' => $request->payment_method,
                'payment_status' => 'pending', // QUAN TRỌNG: Đang chờ thanh toán
                'booking_date' => now(),
            ]);

            // B. LƯU CHI TIẾT
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

            // C. XÓA LOCK GHẾ (Vì đã tạo booking pending, ghế coi như đã được giữ bởi booking này)
            SeatLock::whereIn('seat_id', $seatIds)->where('showtime_id', $request->showtime_id)->delete();

            DB::commit();

            // --- TÍCH HỢP MOMO ---
            if ($request->payment_method === 'momo') {
                $paymentUrl = $this->createMomoUrl($booking);
                return response()->json([
                    'status' => 'redirect', 
                    'url' => $paymentUrl
                ]);
            }

            // Nếu thanh toán tiền mặt/tại quầy
            if ($request->payment_method === 'cash') {
                 $booking->update(['payment_status' => 'paid']); // Giả sử thu tiền luôn
                 return response()->json(['status' => 'success', 'booking_id' => $booking->booking_id]);
            }

            return response()->json(['status' => 'success', 'booking_id' => $booking->booking_id]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    // 3. HÀM RIÊNG TẠO LINK MOMO
    private function createMomoUrl($booking) {
        $orderId = $booking->booking_id . '_' . time(); // ID duy nhất: 123_170123456
        $requestId = $orderId;
        $amount = (string)$booking->total_amount;
        $orderInfo = "Thanh toán vé phim #" . $booking->booking_id;
        $redirectUrl = route('payment.return'); // URL user quay về khi xong
        $ipnUrl = route('payment.return'); // Ở localhost dùng tạm link này, thực tế dùng route('payment.ipn')
        $extraData = "";

        // Tạo chữ ký HMAC SHA256
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

        // Lưu log giao dịch PENDING vào bảng payments
        Payment::create([
            'booking_id' => $booking->booking_id,
            'amount' => $booking->total_amount,
            'provider' => 'MOMO',
            'transaction_code' => $orderId, // Lưu orderId để đối chiếu
            'status' => 'pending'
        ]);

        $response = Http::post($this->momoEndpoint, $data);
        return $response->json()['payUrl'];
    }

    // 4. XỬ LÝ KHI USER QUAY VỀ TỪ MOMO (Redirect URL)
    public function paymentReturn(Request $request)
    {
        // Momo trả về: ?partnerCode=...&orderId=...&requestId=...&amount=...&resultCode=...
        $resultCode = $request->resultCode;
        $orderId = $request->orderId; // Dạng: bookingId_timestamp
        
        // Tách booking ID
        $parts = explode('_', $orderId);
        $bookingId = $parts[0];

        $booking = Booking::find($bookingId);
        $payment = Payment::where('transaction_code', $orderId)->first();

        if ($resultCode == 0) { // 0 là Thành công
            DB::transaction(function () use ($booking, $payment) {
                // Update Booking
                if ($booking) {
                    $booking->payment_status = 'paid';
                    $booking->payment_id = $payment ? $payment->payment_id : null;
                    $booking->save();
                }
                // Update Payment History
                if ($payment) {
                    $payment->status = 'success';
                    $payment->save();
                }
            });

            // Redirect về trang Frontend báo thành công
            return redirect()->to('/payment/result?status=success&booking_id=' . $bookingId);
        } else {
            // Thất bại
            if ($payment) {
                $payment->status = 'failed';
                $payment->save();
            }
            return redirect()->to('/payment/result?status=failed&message=' . $request->message);
        }
    }
    
    // 5. HIỂN THỊ TRANG KẾT QUẢ CUỐI CÙNG
    public function result(Request $request) {
        return Inertia::render('Booking/Result', [
            'status' => $request->status,
            'booking_id' => $request->booking_id,
            'message' => $request->message
        ]);
    }
}