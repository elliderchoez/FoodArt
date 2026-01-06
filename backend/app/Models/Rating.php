<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rating extends Model
{
    use HasFactory;

    protected $table = 'ratings';

    protected $fillable = [
        'user_id',
        'receta_id',
        'rating',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function receta()
    {
        return $this->belongsTo(Receta::class);
    }
}
