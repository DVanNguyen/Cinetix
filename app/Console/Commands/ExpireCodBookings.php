<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ExpireCodBookings extends Command
{
    /**
     * Command signature
     */
    protected $signature = 'bookings:expire-cod';

    /**
     * Command description
     */
    protected $description = 'Tự động hủy các booking COD chưa thanh toán sau 30 phút trước giờ chiếu';

    /**
     * Execute the console command
     */
    public function handle()
    {
        $this->info('🔍 Đang kiểm tra booking COD hết hạn...');

        // Lấy các booking COD pending sắp hết hạn (đã qua 30 phút trước giờ chiếu)
        $expiredBookings = Booking::where('payment_method', Booking::PAYMENT_CASH)
            ->where('payment_status', 'pending')
            ->where('status', Booking::STATUS_PENDING)
            ->whereHas('showtime', function($q) {
                // Giờ chiếu đã qua hoặc còn ít hơn 30 phút
                $q->where('start_time', '<=', now()->addMinutes(30));
            })
            ->with('showtime')
            ->get();

        if ($expiredBookings->isEmpty()) {
            $this->info('✅ Không có booking nào cần hủy.');
            return 0;
        }

        $count = 0;

        foreach ($expiredBookings as $booking) {
            try {
                // Đánh dấu hết hạn và giải phóng ghế
                $booking->markAsExpired();
                
                $this->line("❌ Đã hủy booking #{$booking->booking_id} - Showtime: {$booking->showtime->start_time}");
                
                Log::info("Expired COD booking #{$booking->booking_id}");
                $count++;

            } catch (\Exception $e) {
                $this->error("Lỗi khi hủy booking #{$booking->booking_id}: {$e->getMessage()}");
                Log::error("Error expiring booking #{$booking->booking_id}: {$e->getMessage()}");
            }
        }

        $this->info("✅ Đã hủy {$count} booking COD hết hạn.");
        return 0;
    }
}