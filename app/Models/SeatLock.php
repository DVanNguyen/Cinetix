<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeatLock extends Model
{
    protected $table = 'seat_locks';

    protected $primaryKey = 'lock_id';

    // QUAN TRỌNG: Phải có đầy đủ các cột này
    public $timestamps = false; 
    // --------------------------------------

    protected $fillable = [
        'showtime_id',
        'seat_id',
        'user_id',
        'session_id',
        'locked_at',
        'expires_at',
        'status' => 'active',
    ];

    protected $casts = [
        'locked_at' => 'datetime',
        'expires_at' => 'datetime',
        'status' => 'string',  // Enum: 'active', 'expired'
    ];

    // Relationships
    public function showtime()
    {
        return $this->belongsTo(Showtime::class, 'showtime_id', 'showtime_id');
    }

    public function seat()
    {
        return $this->belongsTo(Seat::class, 'seat_id', 'seat_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}