<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ComboItem extends Model
{
    protected $table = 'combo_items';

    protected $fillable = ['combo_id', 'product_name', 'quantity'];

    // Relationships
    public function combo()
    {
        return $this->belongsTo(Combo::class);
    }
}