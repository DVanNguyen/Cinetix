<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WalletTransaction extends Model
{
    use HasFactory;

    // 1. Cấu hình Primary Key (Do migration bạn đặt là transaction_id)
    protected $primaryKey = 'transaction_id';

    // 2. Tắt timestamps mặc định (Do bảng bạn chỉ có created_at, không có updated_at)
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'type',
        'amount',
        'balance_before',
        'balance_after',
        'description',
        'booking_id',
        'reference_type',
        'reference_id',
        'created_at' // Thêm vào để có thể fill thủ công nếu cần
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    // 3. KHAI BÁO CONSTANTS (Để sửa lỗi đỏ bên file Booking)
    const TYPE_DEPOSIT = 'deposit';   // Nạp tiền
    const TYPE_WITHDRAW = 'withdraw'; // Rút tiền
    const TYPE_REFUND = 'refund';     // Hoàn tiền
    const TYPE_PAYMENT = 'payment';   // Thanh toán
    const TYPE_BONUS = 'bonus';       // Thưởng

    // 4. Relationships
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id', 'booking_id');
    }
}