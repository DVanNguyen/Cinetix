<?php

namespace App\Http\Controllers;

use App\Models\Cinema;
use App\Models\Room;

class CinemaController extends Controller
{
    public function getCinemas()
    {
        // Trả về tất cả rạp + phòng
        $cinemas = Cinema::with('rooms')->get();

        return response()->json([
            'cinemas' => $cinemas
        ]);
    }
}
