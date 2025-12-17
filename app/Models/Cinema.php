<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cinema extends Model
{
    protected $primaryKey = 'cinema_id';
    const UPDATED_AT = null; // Tắt updated_at
    protected $fillable = ['name', 'address', 'phone'];

    // Relationships
    public function rooms()
    {
        return $this->hasMany(Room::class, 'cinema_id', 'cinema_id');
    }
}