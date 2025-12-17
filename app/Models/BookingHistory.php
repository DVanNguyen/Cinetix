<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingHistory extends Model
{
    protected $table = 'booking_history';

    protected $fillable = ['booking_id', 'user_id', 'action', 'description'];

    protected $casts = [
        'action' => 'string',  // Enum: 'created', 'paid', etc.
    ];

    // Relationships
    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}