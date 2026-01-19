<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShoppingList extends Model
{
    protected $fillable = [
        'user_id',
        'meal_plan_id',
        'nombre',
        'descripcion',
        'estado',
        'fecha_objetivo',
    ];

    protected $casts = [
        'fecha_objetivo' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * El usuario propietario
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * El plan de comidas asociado (opcional)
     */
    public function planComidas(): BelongsTo
    {
        return $this->belongsTo(MealPlan::class, 'meal_plan_id');
    }

    /**
     * Los items de la lista
     */
    public function items(): HasMany
    {
        return $this->hasMany(ShoppingListItem::class);
    }

    /**
     * Obtener total gastado
     */
    public function obtenerTotalGastado(): float
    {
        return $this->items()
            ->where('comprado', true)
            ->sum('precio_estimado') ?? 0;
    }

    /**
     * Obtener total estimado
     */
    public function obtenerTotalEstimado(): float
    {
        return $this->items()->sum('precio_estimado') ?? 0;
    }

    /**
     * Obtener progreso (porcentaje comprado)
     */
    public function obtenerProgreso(): int
    {
        $total = $this->items()->count();
        if ($total === 0) return 0;

        $comprados = $this->items()->where('comprado', true)->count();
        return intval(($comprados / $total) * 100);
    }
}
