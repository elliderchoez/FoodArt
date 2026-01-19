<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MealPlan extends Model
{
    protected $fillable = [
        'user_id',
        'titulo',
        'descripcion',
        'estilo_comida',
        'ingredientes_incluir',
        'ingredientes_excluir',
        'fecha_inicio',
        'fecha_fin',
        'estado',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'ingredientes_incluir' => 'array',
        'ingredientes_excluir' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * El usuario propietario del plan
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Los items del plan (recetas)
     */
    public function items(): HasMany
    {
        return $this->hasMany(MealPlanItem::class);
    }

    /**
     * La lista de compras asociada
     */
    public function listaCompras(): HasMany
    {
        return $this->hasMany(ShoppingList::class);
    }
}
