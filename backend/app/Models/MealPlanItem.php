<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MealPlanItem extends Model
{
    protected $fillable = [
        'meal_plan_id',
        'receta_id',
        'dia',
        'comida',
        'porciones',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * El plan de comidas al que pertenece
     */
    public function planComidas(): BelongsTo
    {
        return $this->belongsTo(MealPlan::class, 'meal_plan_id');
    }

    /**
     * La receta del item
     */
    public function receta(): BelongsTo
    {
        return $this->belongsTo(Receta::class);
    }
}
