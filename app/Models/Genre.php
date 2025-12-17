<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Genre extends Model
{

    protected $fillable = ['name'];
    protected $primaryKey = 'genre_id';
    public $timestamps = false;
    // Relationships
    public function movies()
    {
        return $this->hasMany(Movie::class);
    }
}