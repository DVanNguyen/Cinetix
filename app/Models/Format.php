<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Format extends Model
{
    const UPDATED_AT = null; // Tắt updated_at
    protected $primaryKey = 'format_id';
    protected $fillable = ['name', 'description'];

    // Relationships
    public function showtimes()
    {
        return $this->hasMany(Showtime::class, 'format_id', 'format_id');
    }
}