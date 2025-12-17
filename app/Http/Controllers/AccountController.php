<?php

namespace App\Http\Controllers;

// Đảm bảo import đúng file Resource bạn đã tạo trong thư mục Account
use App\Http\Resources\TicketResource; 
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AccountController extends Controller
{
    /**
     * Hiển thị trang tài khoản
     */
    public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user instanceof \App\Models\User) {
            return redirect()->route('login');
        }

        // --- SỬA ĐOẠN NÀY: Tạm thời gán cứng là 0 ---
        // $totalPoints = DB::table('loyalty_points')->where('user_id', $user->user_id)->sum('points');
        // $activeVouchersCount = DB::table('user_vouchers')->where...
        
        $totalPoints = 0;        // Mặc định 0 điểm
        $activeVouchersCount = 0; // Mặc định 0 voucher
        // ---------------------------------------------

        // 2. Tự tính Hạng (Rank) dựa trên điểm (0 điểm -> Bronze)
        $rankName = $this->calculateRankFromPoints($totalPoints);

        // 3. Tính hạng tiếp theo
        $nextRankInfo = $this->calculateNextRank($rankName);

        // 4. Lấy vé (Giữ nguyên)
        $upcoming = Booking::with(['showtime.movie', 'showtime.room.cinema', 'bookingSeats.seat'])
            ->where('user_id', $user->user_id)
            ->whereHas('showtime', fn($q) => $q->where('start_time', '>', now()))
            ->whereIn('payment_status', ['paid'])
            ->orderBy('created_at', 'desc')
            ->take(5)->get();

        $history = Booking::with(['showtime.movie', 'showtime.room.cinema'])
            ->where('user_id', $user->user_id)
            ->whereHas('showtime', fn($q) => $q->where('start_time', '<', now()))
            ->whereIn('payment_status', ['paid'])
            ->orderBy('created_at', 'desc')
            ->take(10)->get();

        return Inertia::render('Auth/Account', [
            'user' => [
                'user_id'       => $user->user_id,
                'full_name'     => $user->full_name,
                'email'         => $user->email,
                'phone'         => $user->phone,
                'avatar_url'    => $user->avatar_url ?? 'https://ui-avatars.com/api/?name=' . urlencode($user->full_name),
                'date_of_birth' => $user->date_of_birth,
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
            ],
            'upcomingTickets' => TicketResource::collection($upcoming),
            'historyTickets'  => TicketResource::collection($history),
        ]);
    }

    /**
     * Cập nhật thông tin cá nhân
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
     * Upload avatar
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg|max:5120' // Max 5MB
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        if (!$user instanceof \App\Models\User) {
            return redirect()->route('login');
        }

        // Xóa ảnh cũ trên S3/Local nếu không phải ảnh mặc định từ UI Avatars
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
     * Đổi mật khẩu
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
     * API Lấy chi tiết vé (cho Modal QR Code)
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

    // ========== HELPER METHODS (Xử lý logic hạng thành viên) ==========

    /**
     * Tính hạng dựa trên tổng điểm tích lũy
     */
    private function calculateRankFromPoints($points) {
        if ($points >= 999999) return 'Diamond';
        if ($points >= 10000) return 'Platinum';
        if ($points >= 5000) return 'Gold';
        if ($points >= 3000) return 'Silver';
        return 'Bronze';
    }

    /**
     * Tính điểm cần thiết để lên hạng tiếp theo
     */
    private function calculateNextRank($currentRank) {
        $ranks = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
        
        // Mốc điểm cần đạt được của từng hạng
        $thresholds = [
            'Silver' => 3000, 
            'Gold' => 5000, 
            'Platinum' => 10000, 
            'Diamond' => 999999
        ];

        $index = array_search($currentRank, $ranks);
        
        // Nếu tìm thấy hạng hiện tại và chưa phải hạng cuối cùng (Diamond)
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