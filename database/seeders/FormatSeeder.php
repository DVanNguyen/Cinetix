<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Format;

class FormatSeeder extends Seeder
{

    protected $primaryKey = 'format_id';
    public function run()
    {
        $formats = [
            ['name' => '2D', 'caption' => 'Phụ đề'],
            ['name' => '2D', 'caption' => 'Lồng tiếng'],
            ['name' => '3D', 'caption' => 'Phụ đề'],
            ['name' => 'IMAX 2D', 'caption' => 'Phụ đề'],
            ['name' => '4DX', 'caption' => 'Tiêu chuẩn'],
        ];
        

        foreach ($formats as $f) {
            Format::firstOrCreate($f);
        }
    }
}