<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingCombo extends Model
{
    protected $table = 'booking_combos';

    protected $fillable = ['booking_id', 'combo_id', 'quantity', 'price_at_booking'];

    protected $casts = [
        'price_at_booking' => 'decimal:2',
    ];

    // Relationships
    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function combo()
    {
        return $this->belongsTo(Combo::class);
    }
}