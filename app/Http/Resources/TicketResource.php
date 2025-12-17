<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class TicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Format ngày giờ: 19:30 • 20/12/2023
        $startTime = Carbon::parse($this->showtime->start_time);
        $formattedTime = $startTime->format('H:i') . ' • ' . $startTime->format('d/m/Y');

        return [
            'booking_id'    => $this->booking_id,
            'booking_code'  => $this->booking_code,
            'status'        => $this->payment_status, 
            'total_price'   => number_format($this->final_total) . ' đ',
            'qr_code'       => $this->qr_code, 
            
            // Movie Info
            'movie' => [
                'title'      => $this->showtime->movie->title,
                'poster_url' => $this->showtime->movie->poster_url,
            ],

            // Location Info
            'cinema'   => $this->showtime->room->cinema->name,
            'room'     => $this->showtime->room->name,
            'showtime' => $formattedTime,
            
            // Logic nối chuỗi ghế: "F4, F5, F6"
            'seats' => $this->relationLoaded('bookingSeats') 
                ? $this->bookingSeats->map(fn($bs) => $bs->seat->seat_row . $bs->seat->seat_number)->join(', ')
                : '',
        ];
    }
}