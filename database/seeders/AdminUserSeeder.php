<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run()
    {
        // Sử dụng updateOrCreate để tránh trùng lặp nếu chạy seeder nhiều lần
        User::updateOrCreate(
            ['email' => 'admin@cinetix.vn'], // Gmail "thực thụ" cho Admin
            [
                'name' => 'Nguyên',
                'phone' => '0329129319',
                'password' => Hash::make('Admin@123'), // Quan trọng: Mã hóa mật khẩu
                'role' => 'admin',
            ]
        );
    }
}