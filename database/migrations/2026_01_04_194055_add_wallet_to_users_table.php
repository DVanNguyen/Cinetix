<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Thêm sau cột 'role'
            $table->decimal('wallet_balance', 15, 2)->default(0.00)->after('role');
            
            // Index để query nhanh
            $table->index('wallet_balance');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['wallet_balance']);
            $table->dropColumn('wallet_balance');
        });
    }
};
