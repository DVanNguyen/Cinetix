<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB; // Nhớ import DB Facade

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // 1. Thêm cột status
            $table->enum('status', ['pending', 'confirmed', 'cancelled', 'refunded', 'expired'])
                ->default('pending')
                ->after('payment_status')
                ->comment('Trạng thái booking chi tiết');
            
            // 2. Thông tin hoàn tiền
            $table->decimal('refund_amount', 15, 2)
                ->nullable()
                ->after('final_total')
                ->comment('Số tiền đã hoàn');
            
            $table->timestamp('refunded_at')
                ->nullable()
                ->after('created_at')
                ->comment('Thời gian hoàn tiền');
            
            $table->text('cancel_reason')
                ->nullable()
                ->after('refunded_at')
                ->comment('Lý do hủy vé');
            
            // 3. Indexes
            $table->index(['status', 'created_at']);
            $table->index('refunded_at');
        });
        
        // ✅ SỬA: Thêm 'card' vào danh sách để khớp với dữ liệu cũ
        DB::statement("ALTER TABLE bookings MODIFY COLUMN payment_method ENUM('momo', 'zalopay', 'wallet', 'atm', 'cash', 'card') NULL");
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['status', 'created_at']);
            $table->dropIndex(['refunded_at']);
            $table->dropColumn(['status', 'refund_amount', 'refunded_at', 'cancel_reason']);
        });
        
        // Khi rollback cũng cần giữ lại các giá trị cũ, nếu không sẽ bị lỗi
        DB::statement("ALTER TABLE bookings MODIFY COLUMN payment_method ENUM('momo', 'zalopay', 'card', 'atm', 'cash') NULL");
    }
};