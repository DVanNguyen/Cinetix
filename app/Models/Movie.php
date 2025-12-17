<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Movie extends Model
{
    protected $primaryKey = 'movie_id';
    protected $fillable = [
        'title', 'tmdb_id', 'description', 'duration', 'genre_id', 'director', 'cast', 'rating',
        'release_date', 'poster_url', 'trailer_url', 'status'
    ];

    protected $casts = [
        'release_date' => 'date',
        'status' => 'string',  // Enum: 'coming_soon', 'now_showing', 'ended'
    ];

    // Relationships
    public function genre()
    {
        return $this->belongsTo(Genre::class, 'genre_id', 'genre_id' );
    }
    
    public function showtimes()
    {
        return $this->hasMany(Showtime::class, 'movie_id', 'movie_id');
    }

    public function schedules()
    {
        return $this->hasMany(MovieSchedule::class, 'movie_id', 'movie_id');
    }

    public function reviews()
    {
        return $this->hasMany(MovieReview::class);
    }
}