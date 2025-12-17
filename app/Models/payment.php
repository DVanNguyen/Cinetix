<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'booking_id', 'amount', 'provider', 'transaction_code', 'status'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'status' => 'string',  // Enum: 'pending', 'success', etc.
    ];

    // Relationships
    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}