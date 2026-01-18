<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecetaCategoria extends Model
{
    use HasFactory;

    protected $table = 'receta_categorias';

    protected $fillable = [
        'user_id',
        'receta_id',
        'nombre',
        'descripcion',
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
