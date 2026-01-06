<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB; 
use App\Models\WalletTransaction;  
use App\Models\SeatLock;           

class Booking extends Model
{
    protected $primaryKey = 'booking_id';
    const UPDATED_AT = null;
    
    protected $fillable = [
        'user_id', 
        'showtime_id', 
        'total_amount', 
        'combo_total', 
        'voucher_discount',
        'final_total', 
        'payment_method', 
        'payment_status', 
        'payment_id',
        'status',           
        'refund_amount',    
        'refunded_at',      
        'cancel_reason'     
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'combo_total' => 'decimal:2',
        'voucher_discount' => 'decimal:2',
        'final_total' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'payment_method' => 'string',
        'payment_status' => 'string',
        'status' => 'string',
        'created_at' => 'datetime',
        'refunded_at' => 'datetime'
    ];

    // ✅ STATUS CONSTANTS
    const STATUS_PENDING = 'pending';       // Chờ thanh toán
    const STATUS_CONFIRMED = 'confirmed';   // Đã thanh toán
    const STATUS_CANCELLED = 'cancelled';   // Đã hủy
    const STATUS_REFUNDED = 'refunded';     // Đã hoàn tiền
    const STATUS_EXPIRED = 'expired';       // Hết hạn (COD không đến)

    // ✅ PAYMENT METHOD CONSTANTS
    const PAYMENT_MOMO = 'momo';
    const PAYMENT_WALLET = 'wallet';
    const PAYMENT_CASH = 'cash';

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function showtime()
    {
        return $this->belongsTo(Showtime::class, 'showtime_id', 'showtime_id');
    }

    public function bookingSeats()
    {
        return $this->hasMany(BookingSeat::class, 'booking_id', 'booking_id');
    }

    public function bookingCombos()
    {
        return $this->hasMany(BookingCombo::class, 'booking_id', 'booking_id');
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class, 'payment_id', 'payment_id');
    }

    public function walletTransactions()
    {
        return $this->hasMany(WalletTransaction::class, 'booking_id', 'booking_id');
    }

    // ============================================
    // REFUND METHODS
    // ============================================

    /**
     * ✅ Kiểm tra có thể hủy vé không (trước 30 phút)
     */
    public function canCancel()
    {
        if (!in_array($this->status, [self::STATUS_PENDING, self::STATUS_CONFIRMED])) {
            return false;
        }

        if (!$this->showtime) {
            return false;
        }

        $showtime = Carbon::parse($this->showtime->start_time);
        $now = Carbon::now();
        $minutesUntilShow = $now->diffInMinutes($showtime, false);

        return $minutesUntilShow >= 30;
    }

    /**
     * ✅ Hủy vé và hoàn tiền
     */
    public function cancelAndRefund($reason = null)
    {
        if (!$this->canCancel()) {
            throw new \Exception('Không thể hủy vé (phải trước 30 phút giờ chiếu)');
        }

        return DB::transaction(function () use ($reason) {
            // 1. Cập nhật trạng thái booking
            $this->update([
                'status' => self::STATUS_CANCELLED,
                'cancel_reason' => $reason
            ]);

            // 2. Giải phóng ghế
            $this->releaseSeats();

            // 3. Hoàn tiền nếu đã thanh toán online
            if ($this->payment_status === 'paid' && in_array($this->payment_method, [self::PAYMENT_MOMO, self::PAYMENT_WALLET])) {
                $this->processRefund();
            }

            return true;
        });
    }

    /**
     * ✅ Xử lý hoàn tiền vào ví
     */
    private function processRefund()
    {
        $refundAmount = $this->final_total;

        // Hoàn tiền vào ví user
        $this->user->addToWallet(
            $refundAmount,
            WalletTransaction::TYPE_REFUND,
            "Hoàn tiền hủy vé #{$this->booking_id}",
            $this->booking_id,
            'booking_cancel',
            $this->booking_id
        );

        // Cập nhật thông tin hoàn tiền
        $this->update([
            'status' => self::STATUS_REFUNDED,
            'refund_amount' => $refundAmount,
            'refunded_at' => now()
        ]);
    }

    /**
     * ✅ Giải phóng ghế khi hủy vé
     */
    private function releaseSeats()
    {
        $seatIds = $this->bookingSeats->pluck('seat_id')->toArray();
        
        // Xóa tất cả lock của ghế này (nếu có)
        SeatLock::whereIn('seat_id', $seatIds)
            ->where('showtime_id', $this->showtime_id)
            ->delete();

        // Ghế sẽ tự động available vì không còn trong booking confirmed
    }

    /**
     * ✅ Đánh dấu booking hết hạn (cho COD không đến)
     */
    public function markAsExpired()
    {
        $this->update([
            'status' => self::STATUS_EXPIRED,
            'cancel_reason' => 'Khách hàng không đến (thanh toán tiền mặt)'
        ]);

        $this->releaseSeats();
    }

    /**
     * ✅ Scopes
     */
    public function scopeCanCancel($query)
    {
        return $query->whereIn('status', [self::STATUS_PENDING, self::STATUS_CONFIRMED])
            ->whereHas('showtime', function($q) {
                $q->where('start_time', '>', now()->addMinutes(30));
            });
    }

    public function scopeCashPendingExpiringSoon($query)
    {
        return $query->where('payment_method', self::PAYMENT_CASH)
            ->where('payment_status', 'pending')
            ->whereHas('showtime', function($q) {
                $q->whereBetween('start_time', [now()->addMinutes(15), now()->addMinutes(30)]);
            });
    }
}