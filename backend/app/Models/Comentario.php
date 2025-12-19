<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comentario extends Model
{
    use HasFactory;

    protected $table = 'comentarios';

    protected $fillable = [
        'user_id',
        'receta_id',
        'contenido',
        'calificacion',
    ];

    public $timestamps = true;

    // Relaciones
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function receta()
    {
        return $this->belongsTo(Receta::class, 'receta_id');
    }
}
