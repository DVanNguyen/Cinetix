<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{

    protected $primaryKey = 'booking_id';
    const UPDATED_AT = null;
    
    protected $fillable = [
        'user_id', 'showtime_id', 'total_amount', 'combo_total', 'voucher_discount',
        'final_total', 'payment_method', 'payment_status', 'payment_id'
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'combo_total' => 'decimal:2',
        'voucher_discount' => 'decimal:2',
        'final_total' => 'decimal:2',
        'payment_method' => 'string',  // Enum: 'momo', 'zalopay', etc.
        'payment_status' => 'string',  // Enum: 'pending', 'paid', etc.
    ];

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

    public function history()
    {
        return $this->hasMany(BookingHistory::class, 'booking_id', 'booking_id');
    }
}