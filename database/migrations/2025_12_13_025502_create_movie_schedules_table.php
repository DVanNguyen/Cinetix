<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
{
    Schema::create('movie_schedules', function (Blueprint $table) {
        $table->id();
        $table->date('show_date');

        // --- SỬA ĐOẠN NÀY ---
        // Dùng integer (Signed) để khớp với kiểu "int" của bảng movies
        $table->integer('movie_id'); 
        
        // Khai báo khóa ngoại thủ công
        $table->foreign('movie_id')->references('movie_id')->on('movies')->onDelete('cascade');
        // --------------------

        $table->integer('position')->default(0);
        $table->unique(['show_date', 'movie_id']);
        $table->timestamps();
    });
}

    public function down(): void
    {
        Schema::dropIfExists('movie_schedules');
    }
};