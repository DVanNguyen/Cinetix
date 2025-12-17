<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingSeat extends Model
{

    protected $primaryKey = 'booking_seat_id';
    protected $table = 'booking_seats';

    public $timestamps = false;

    protected $fillable = ['booking_id', 'seat_id', 'price'];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    // Relationships
    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id', 'booking_id');
    }

    public function seat()
    {
        return $this->belongsTo(Seat::class, 'seat_id', 'seat_id');
    }
}