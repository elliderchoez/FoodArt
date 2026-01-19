<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShoppingListItem extends Model
{
    protected $fillable = [
        'shopping_list_id',
        'ingrediente',
        'cantidad',
        'unidad',
        'precio_estimado',
        'comprado',
        'comprado_at',
        'notas',
    ];

    protected $casts = [
        'cantidad' => 'float',
        'precio_estimado' => 'float',
        'comprado' => 'boolean',
        'comprado_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * La lista de compras a la que pertenece
     */
    public function listaCompras(): BelongsTo
    {
        return $this->belongsTo(ShoppingList::class, 'shopping_list_id');
    }

    /**
     * Marcar como comprado
     */
    public function marcarComprado(): void
    {
        $this->update([
            'comprado' => true,
            'comprado_at' => now(),
        ]);
    }

    /**
     * Marcar como no comprado
     */
    public function marcarNoComprado(): void
    {
        $this->update([
            'comprado' => false,
            'comprado_at' => null,
        ]);
    }
}
