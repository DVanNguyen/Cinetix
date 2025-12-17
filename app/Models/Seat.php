<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Seat extends Model
{
    protected $primaryKey = 'seat_id';
    protected $fillable = ['room_id', 'seat_row', 'seat_number', 'seat_type'];

    public $timestamps = false;

    protected $casts = [
        'seat_type' => 'string',  // Enum: 'standard', 'vip', 'couple'
    ];

    // Relationships
    public function room()
    {
        return $this->belongsTo(Room::class, 'room_id', 'room_id');
    }

    public function seatLocks()
    {
        return $this->hasMany(SeatLock::class);
    }

    public function bookingSeats()
    {
        return $this->hasMany(BookingSeat::class, 'seat_id', 'seat_id');
    }
}