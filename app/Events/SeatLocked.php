<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast; // <--- BẮT BUỘC
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SeatLocked implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $showtimeId,
        public int $seatId,
        public ?int $userId,     
        public string $sessionId 
    ) {}

    public function broadcastOn(): array
    {
        // Trả về mảng chứa Channel
        return [
            new Channel('showtime.' . $this->showtimeId)
        ];
    }

    public function broadcastAs(): string
    {
        return 'seat.locked';
    }
}