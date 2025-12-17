<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Showtime extends Model
{
    protected $primaryKey = 'showtime_id';
    protected $fillable = [
        'movie_id', 'room_id', 'format_id', 'start_time', 'end_time', 'price'
    ];

    const UPDATED_AT = null; // Tắt updated_at

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'price' => 'decimal:2',
    ];

    // Relationships
    public function movie()
    {
        return $this->belongsTo(Movie::class, 'movie_id', 'movie_id');
    }

    public function room()
    {
        return $this->belongsTo(Room::class, 'room_id', 'room_id');
    }

    public function format()
    {
        return $this->belongsTo(Format::class);
    }

    public function seatLocks()
    {
        return $this->hasMany(SeatLock::class, 'showtime_id', 'showtime_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'showtime_id', 'showtime_id');
    }
}