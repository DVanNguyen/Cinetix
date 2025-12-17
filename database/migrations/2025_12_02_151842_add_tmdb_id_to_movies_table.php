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
            // Kiểm tra xem cột có chưa, chưa có mới thêm
            if (!Schema::hasColumn('movies', 'tmdb_id')) {
                // Thêm cột tmdb_id, cho phép null, đánh index (unique) để tìm nhanh, đặt sau cột movie_id
                $table->unsignedBigInteger('tmdb_id')->nullable()->unique()->after('movie_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('movies', function (Blueprint $table) {
            // Hướng dẫn xóa cột nếu muốn quay lại (rollback)
            if (Schema::hasColumn('movies', 'tmdb_id')) {
                $table->dropColumn('tmdb_id');
            }
        });
    }
};