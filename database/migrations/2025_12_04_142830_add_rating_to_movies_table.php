<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('movies', function (Blueprint $table) {
            // Kiểm tra nếu chưa có cột rating thì mới thêm
            if (!Schema::hasColumn('movies', 'rating')) {
                // Thêm cột rating kiểu số thập phân (vd: 8.5), mặc định 0, đặt sau cột duration
                $table->decimal('rating', 3, 1)->default(0)->after('duration');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('movies', function (Blueprint $table) {
            if (Schema::hasColumn('movies', 'rating')) {
                $table->dropColumn('rating');
            }
        });
    }
};