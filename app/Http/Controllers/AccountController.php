<?php

namespace App\Http\Controllers;

use App\Http\Resources\TicketResource; 
use App\Models\Booking;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AccountController extends Controller
{
    /**
     * ✅ Hiển thị trang tài khoản (có thêm wallet info)
     */
    public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user instanceof \App\Models\User) {
            return redirect()->route('login');
        }

        // Membership (giữ nguyên)
        $totalPoints = 0;        
        $activeVouchersCount = 0; 
        $rankName = $this->calculateRankFromPoints($totalPoints);
        $nextRankInfo = $this->calculateNextRank($rankName);

        // ✅ Lấy vé (CÓ THỂ HỦY)
        $upcoming = Booking::with(['showtime.movie', 'showtime.room.cinema', 'bookingSeats.seat'])
            ->where('user_id', $user->user_id)
            ->whereHas('showtime', fn($q) => $q->where('start_time', '>', now()))
            ->whereIn('status', [Booking::STATUS_PENDING, Booking::STATUS_CONFIRMED])
            ->whereIn('payment_status', ['paid', 'pending'])
            ->orderBy('created_at', 'desc')
            ->take(10)->get();

        // ✅ Lịch sử (bao gồm cả vé đã hủy)
        $history = Booking::with(['showtime.movie', 'showtime.room.cinema'])
            ->where('user_id', $user->user_id)
            ->where(function($q) {
                $q->whereHas('showtime', fn($sq) => $sq->where('start_time', '<', now()))
                  ->orWhereIn('status', [Booking::STATUS_CANCELLED, Booking::STATUS_REFUNDED, Booking::STATUS_EXPIRED]);
            })
            ->orderBy('created_at', 'desc')
            ->take(20)->get();

        // ✅ Lịch sử giao dịch ví (10 giao dịch gần nhất)
        $walletTransactions = WalletTransaction::where('user_id', $user->user_id)
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function($transaction) {
                return [
                    'transaction_id' => $transaction->transaction_id,
                    'type' => $transaction->type,
                    'amount' => $transaction->amount,
                    'formatted_amount' => $transaction->formatted_amount,
                    'description' => $transaction->description,
                    'balance_after' => $transaction->balance_after,
                    'created_at' => $transaction->created_at->format('d/m/Y H:i'),
                    'icon' => $transaction->icon,
                    'color' => $transaction->color
                ];
            });

        return Inertia::render('Auth/Account', [
            'user' => [
                'user_id'       => $user->user_id,
                'full_name'     => $user->name,
                'email'         => $user->email,
                'phone'         => $user->phone,
                'avatar_url'    => $user->avatar_url ?? 'https://ui-avatars.com/api/?name=' . urlencode($user->name),
                'wallet_balance' => $user->wallet_balance,
                'formatted_wallet_balance' => $user->formatted_wallet_balance,
            ],
            'membership' => [
                'current_rank'     => $rankName,
                'points'           => (int)$totalPoints,
                'next_rank'        => $nextRankInfo['next_rank'],
                'next_rank_points' => $nextRankInfo['next_rank_points'],
            ],
            'stats' => [
                'points'   => (int)$totalPoints,
                'vouchers' => $activeVouchersCount,
                'wallet_balance' => $user->wallet_balance,
            ],
            'upcomingTickets' => TicketResource::collection($upcoming),
            'historyTickets'  => TicketResource::collection($history),
            'walletTransactions' => $walletTransactions,
        ]);
    }

    /**
     * ✅ HỦY VÉ VÀ HOÀN TIỀN
     */
    public function cancelTicket(Request $request, $bookingId)
    {
        try {
            /** @var \App\Models\User */
            $user = Auth::user();
            
            $booking = Booking::with('showtime')->findOrFail($bookingId);

            // 1. Kiểm tra quyền sở hữu
            if ($booking->user_id !== $user->user_id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Bạn không có quyền hủy vé này'
                ], 403);
            }

            // 2. Kiểm tra có thể hủy không
            if (!$booking->canCancel()) {
                $showtime = $booking->showtime;
                $minutesLeft = now()->diffInMinutes($showtime->start_time, false);
                
                if ($minutesLeft < 30) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Chỉ có thể hủy vé trước 30 phút giờ chiếu'
                    ], 400);
                }

                return response()->json([
                    'status' => 'error',
                    'message' => 'Không thể hủy vé này'
                ], 400);
            }

            // 3. Hủy vé và hoàn tiền
            $booking->cancelAndRefund($request->input('reason', 'Khách hàng hủy'));

            return response()->json([
                'status' => 'success',
                'message' => 'Hủy vé thành công! ' . 
                    ($booking->payment_method !== Booking::PAYMENT_CASH 
                        ? 'Tiền đã được hoàn vào ví của bạn.' 
                        : ''),
                'refund_amount' => $booking->refund_amount
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ Cập nhật thông tin cá nhân (giữ nguyên)
     */
    public function updateProfile(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user instanceof \App\Models\User) {
            return redirect()->route('login');
        }
        
        $validated = $request->validate([
            'full_name'     => 'required|string|max:255',
            'phone'         => 'required|string|max:20',
            'date_of_birth' => 'nullable|date',
        ]);

        $user->update($validated);

        return back()->with('success', 'Cập nhật thông tin thành công!');
    }

    /**
     * ✅ Upload avatar (giữ nguyên)
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg|max:5120'
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        if (!$user instanceof \App\Models\User) {
            return redirect()->route('login');
        }

        if ($user->avatar_url && !str_contains($user->avatar_url, 'ui-avatars.com')) {
             $oldPath = str_replace('/storage/', '', $user->avatar_url);
             if(Storage::disk('public')->exists($oldPath)) {
                 Storage::disk('public')->delete($oldPath);
             }
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        
        $user->update([
            'avatar_url' => Storage::url($path)
        ]);

        return back()->with('success', 'Đổi ảnh đại diện thành công!');
    }

    /**
     * ✅ Đổi mật khẩu (giữ nguyên)
     */
    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'], 
            'new_password'     => ['required', 'min:8', 'confirmed'],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['new_password'])
        ]);

        return back()->with('success', 'Đổi mật khẩu thành công!');
    }

    /**
     * ✅ API: Chi tiết vé
     */
    public function getTicketDetail($bookingId)
    {
        $booking = Booking::with(['showtime.movie', 'showtime.room.cinema', 'bookingSeats.seat', 'bookingCombos.combo'])
            ->findOrFail($bookingId);

        if ($booking->user_id !== Auth::id()) {
            abort(403, 'Bạn không có quyền xem vé này');
        }

        return new TicketResource($booking);
    }

    /**
     * ✅ API: Lịch sử giao dịch ví (Trang riêng - optional)
     */
    public function walletHistory(Request $request)
    {
        /** @var \App\Models\User */
        $user = Auth::user();

        $type = $request->query('type'); // filter: refund, payment, deposit...
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = WalletTransaction::where('user_id', $user->user_id);

        if ($type) {
            $query->where('type', $type);
        }

        if ($startDate && $endDate) {
            $query->betweenDates($startDate, $endDate);
        }

        $transactions = $query->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Auth/WalletHistory', [
            'transactions' => $transactions,
            'user' => [
                'wallet_balance' => $user->wallet_balance,
                'formatted_wallet_balance' => $user->formatted_wallet_balance
            ]
        ]);
    }

    // ========== HELPER METHODS ==========

    private function calculateRankFromPoints($points) {
        if ($points >= 999999) return 'Diamond';
        if ($points >= 10000) return 'Platinum';
        if ($points >= 5000) return 'Gold';
        if ($points >= 3000) return 'Silver';
        return 'Bronze';
    }

    private function calculateNextRank($currentRank) {
        $ranks = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
        $thresholds = ['Silver' => 3000, 'Gold' => 5000, 'Platinum' => 10000, 'Diamond' => 999999];
        $index = array_search($currentRank, $ranks);
        
        if ($index !== false && isset($ranks[$index + 1])) {
            $nextRank = $ranks[$index + 1];
            return [
                'next_rank' => $nextRank,
                'next_rank_points' => $thresholds[$nextRank]
            ];
        }

        return ['next_rank' => null, 'next_rank_points' => null];
    }
}