<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Resena extends Model
{
    use HasFactory;

    protected $fillable = [
        'receta_id',
        'user_id',
        'calificacion',
        'texto',
        'likes_count',
    ];

    public function receta()
    {
        return $this->belongsTo(Receta::class);
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
