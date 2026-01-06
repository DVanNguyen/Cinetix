<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\DB;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;
    
    protected $primaryKey = 'user_id';

    protected $fillable = [
        'name', 
        'email', 
        'password', 
        'phone', 
        'role',
        'wallet_balance' // ✅ Thêm
    ];

    protected $hidden = [
        'password', 
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'role' => 'string',
        'wallet_balance' => 'decimal:2', // ✅ Thêm
    ];

    // ============================================
    // RELATIONSHIPS
    // ============================================
    
    public function bookings()
    {
        return $this->hasMany(Booking::class, 'user_id', 'user_id');
    }

    public function walletTransactions()
    {
        return $this->hasMany(WalletTransaction::class, 'user_id', 'user_id');
    }

    public function reviews()
    {
        return $this->hasMany(MovieReview::class, 'user_id', 'user_id');
    }

    public function seatLocks()
    {
        return $this->hasMany(SeatLock::class, 'user_id', 'user_id');
    }

    // ============================================
    // WALLET METHODS
    // ============================================

    /**
     * ✅ Thêm tiền vào ví (Nạp tiền, Hoàn tiền, Thưởng)
     */
    public function addToWallet($amount, $type, $description, $bookingId = null, $referenceType = null, $referenceId = null)
    {
        return DB::transaction(function () use ($amount, $type, $description, $bookingId, $referenceType, $referenceId) {
            $balanceBefore = $this->wallet_balance;
            $balanceAfter = $balanceBefore + $amount;

            // Update balance
            $this->increment('wallet_balance', $amount);

            // Create transaction record
            return WalletTransaction::create([
                'user_id' => $this->user_id,
                'type' => $type,
                'amount' => $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'description' => $description,
                'booking_id' => $bookingId,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId
            ]);
        });
    }

    /**
     * ✅ Trừ tiền khỏi ví (Thanh toán, Rút tiền)
     */
    public function deductFromWallet($amount, $type, $description, $bookingId = null, $referenceType = null, $referenceId = null)
    {
        if ($this->wallet_balance < $amount) {
            throw new \Exception('Số dư ví không đủ');
        }

        return DB::transaction(function () use ($amount, $type, $description, $bookingId, $referenceType, $referenceId) {
            $balanceBefore = $this->wallet_balance;
            $balanceAfter = $balanceBefore - $amount;

            // Update balance
            $this->decrement('wallet_balance', $amount);

            // Create transaction record
            return WalletTransaction::create([
                'user_id' => $this->user_id,
                'type' => $type,
                'amount' => $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'description' => $description,
                'booking_id' => $bookingId,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId
            ]);
        });
    }

    /**
     * ✅ Kiểm tra số dư ví
     */
    public function hasEnoughBalance($amount)
    {
        return $this->wallet_balance >= $amount;
    }

    /**
     * ✅ Format wallet balance
     */
    public function getFormattedWalletBalanceAttribute()
    {
        return number_format($this->wallet_balance, 0, ',', '.') . ' Xu';
    }
}