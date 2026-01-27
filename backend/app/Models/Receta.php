<?php

namespace App\Models;

// ...existing code...

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Receta extends Model
{
    use HasFactory;

    protected $table = 'recetas';

    protected $fillable = [
        'user_id',
        'titulo',
        'descripcion',
        'imagen_url',
        'tiempo_preparacion',
        'porciones',
        'dificultad',
        'ingredientes',
        'pasos',
        'categoria',
        'tipo_dieta',
        'likes_count',
        'comentarios_count',
        'is_blocked',
        'block_reason',
    ];

    protected $casts = [
        'ingredientes' => 'array',
        'pasos' => 'array',
    ];

    // Relaciones
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function likes()
    {
        return $this->hasMany(Like::class, 'receta_id');
    }

    public function comentarios()
    {
        return $this->hasMany(Comentario::class, 'receta_id');
    }

    public function recetasGuardadas()
    {
        return $this->hasMany(RecetaGuardada::class, 'receta_id');
    }

    public function ratings()
    {
        return $this->hasMany(Rating::class, 'receta_id');
    }

    /**
     * Obtener promedio de rating (float) o null si no hay.
     */
    public function ratingAverage()
    {
        return $this->ratings()->avg('rating');
    }

    /**
     * Contador de ratings
     */
    public function ratingCount()
    {
        return $this->ratings()->count();
    }

    // Scope: obtener recetas ordenadas por fecha
    public function scopeLatest($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    // Scope: obtener recetas populares
    public function scopePopular($query)
    {
        return $query->orderBy('likes_count', 'desc');
    }
}
