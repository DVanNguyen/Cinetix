<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Combo extends Model
{
    protected $primaryKey = 'combo_id';
    protected $fillable = ['name', 'description', 'price', 'image_url', 'is_active'];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function items()
    {
        return $this->hasMany(ComboItem::class);
    }

    public function bookingCombos()
    {
        return $this->hasMany(BookingCombo::class);
    }
}