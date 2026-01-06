<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id('transaction_id');
            
            // SỬA: Dùng integer thường để khớp với Type "int" của bảng users
            $table->integer('user_id');
            
            $table->enum('type', ['deposit', 'withdraw', 'refund', 'payment', 'bonus'])
                ->comment('Loại giao dịch');
            
            $table->decimal('amount', 15, 2)->comment('Số tiền');
            $table->decimal('balance_before', 15, 2)->comment('Số dư trước giao dịch');
            $table->decimal('balance_after', 15, 2)->comment('Số dư sau giao dịch');
            
            $table->string('description', 255)->nullable()->comment('Mô tả giao dịch');
            
            // SỬA: Dùng integer thường (tương tự user_id, dự đoán bảng bookings cũng dùng int)
            $table->integer('booking_id')->nullable()->comment('ID booking liên quan');
            
            $table->string('reference_type', 50)->nullable()->comment('Loại tham chiếu');
            $table->unsignedBigInteger('reference_id')->nullable()->comment('ID tham chiếu');
            
            $table->timestamp('created_at')->useCurrent();
            
            // Foreign keys
            $table->foreign('user_id')
                ->references('user_id')
                ->on('users')
                ->onDelete('cascade');
            
            $table->foreign('booking_id')
                ->references('booking_id')
                ->on('bookings')
                ->onDelete('set null');
            
            // Indexes
            $table->index(['user_id', 'created_at']);
            $table->index('type');
            $table->index('booking_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};