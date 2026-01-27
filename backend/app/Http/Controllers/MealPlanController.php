<?php

namespace App\Http\Controllers;

use App\Models\MealPlan;
use App\Models\MealPlanItem;
use App\Models\ShoppingList;
use App\Models\ShoppingListItem;
use App\Models\Receta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MealPlanController extends Controller
{
    /**
     * Obtener todos los planes del usuario autenticado
     */
    public function index()
    {
        $planes = Auth::user()
            ->mealPlans()
            ->with('items.receta')
            ->orderBy('fecha_inicio', 'desc')
            ->get();

        return response()->json([
            'data' => $planes,
        ]);
    }

    /**
     * Crear nuevo plan de comidas personalizado
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'estilo_comida' => 'required|in:vegana,vegetariana,gimnasio,perdida_peso,mixta',
            'ingredientes_incluir' => 'nullable|string',
            'ingredientes_excluir' => 'nullable|string',
            'fecha_inicio' => 'required|date|after:yesterday',
            'fecha_fin' => 'nullable|date|after:fecha_inicio',
        ]);

        // Convertir ingredientes a arrays
        $ingredientesIncluir = $validated['ingredientes_incluir']
            ? array_filter(array_map('trim', explode(',', $validated['ingredientes_incluir'])))
            : [];

        $ingredientesExcluir = $validated['ingredientes_excluir']
            ? array_filter(array_map('trim', explode(',', $validated['ingredientes_excluir'])))
            : [];

        // Crear el plan
        $plan = Auth::user()->mealPlans()->create([
            'titulo' => $validated['titulo'],
            'descripcion' => $validated['descripcion'] ?? null,
            'estilo_comida' => $validated['estilo_comida'],
            'ingredientes_incluir' => $ingredientesIncluir ?: null,
            'ingredientes_excluir' => $ingredientesExcluir ?: null,
            'fecha_inicio' => $validated['fecha_inicio'],
            'fecha_fin' => $validated['fecha_fin'] ?? null,
        ]);

        // Generar recetas personalizadas automáticamente
        $this->generarRecetasPersonalizadas($plan);

        return response()->json([
            'data' => $plan->load('items.receta'),
            'message' => 'Plan de comidas personalizado creado exitosamente',
        ], 201);
    }

    /**
     * Obtener detalle de un plan
     */
    public function show(MealPlan $mealPlan)
    {
        // Verificar que el plan pertenece al usuario autenticado
        if ($mealPlan->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        return response()->json([
            'data' => $mealPlan->load('items.receta'),
        ]);
    }

    /**
     * Actualizar plan de comidas
     */
    public function update(Request $request, MealPlan $mealPlan)
    {
        if ($mealPlan->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'titulo' => 'sometimes|string|max:255',
            'descripcion' => 'nullable|string',
            'fecha_inicio' => 'sometimes|date',
            'fecha_fin' => 'nullable|date|after:fecha_inicio',
            'estado' => 'sometimes|in:activo,pausado,completado',
        ]);

        $mealPlan->update($validated);

        return response()->json([
            'data' => $mealPlan,
            'message' => 'Plan actualizado exitosamente',
        ]);
    }

    /**
     * Eliminar plan de comidas
     */
    public function destroy(MealPlan $mealPlan)
    {
        if ($mealPlan->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $mealPlan->delete();

        return response()->json([
            'message' => 'Plan eliminado exitosamente',
        ]);
    }

    /**
     * Agregar receta al plan
     */
    public function agregarReceta(Request $request, MealPlan $mealPlan)
    {
        if ($mealPlan->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'receta_id' => 'required|exists:recetas,id',
            'dia' => 'required|in:lunes,martes,miercoles,jueves,viernes,sabado,domingo',
            'comida' => 'required|in:desayuno,almuerzo,merienda,cena',
            'porciones' => 'required|integer|min:1',
        ]);

        // Verificar que el plan no exceda 3 recetas
        $totalRecetas = $mealPlan->items()->count();
        if ($totalRecetas >= 3) {
            return response()->json([
                'message' => 'El plan de comidas no puede contener más de 3 recetas',
            ], 422);
        }

        // Verificar que no exista ya la combinación
        $existe = MealPlanItem::where([
            'meal_plan_id' => $mealPlan->id,
            'dia' => $validated['dia'],
            'comida' => $validated['comida'],
        ])->exists();

        if ($existe) {
            return response()->json([
                'message' => 'Ya existe una receta para este día y comida',
            ], 409);
        }

        $item = $mealPlan->items()->create($validated);

        return response()->json([
            'data' => $item->load('receta'),
            'message' => 'Receta agregada al plan',
        ], 201);
    }

    /**
     * Eliminar receta del plan
     */
    public function removerReceta(MealPlan $mealPlan, MealPlanItem $item)
    {
        if ($mealPlan->user_id !== Auth::id() || $item->meal_plan_id !== $mealPlan->id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $item->delete();

        return response()->json([
            'message' => 'Receta removida del plan',
        ]);
    }

    /**
     * Generar lista de compras desde el plan
     */
    public function generarListaCompras(Request $request, MealPlan $mealPlan)
    {
        if ($mealPlan->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'fecha_objetivo' => 'nullable|date',
        ]);

        // Crear lista de compras
        $lista = ShoppingList::create([
            'user_id' => Auth::id(),
            'meal_plan_id' => $mealPlan->id,
            'nombre' => $validated['nombre'],
            'descripcion' => $validated['descripcion'] ?? null,
            'fecha_objetivo' => $validated['fecha_objetivo'] ?? null,
        ]);

        // Agrupar ingredientes de todas las recetas del plan
        $ingredientesAgrupados = [];
        foreach ($mealPlan->items as $item) {
            if ($item->receta && $item->receta->ingredientes) {
                $ingredientes = is_string($item->receta->ingredientes)
                    ? json_decode($item->receta->ingredientes, true)
                    : $item->receta->ingredientes;

                if (is_array($ingredientes)) {
                    foreach ($ingredientes as $ingrediente) {
                        $nombre = $ingrediente['nombre'] ?? $ingrediente;
                        if (!isset($ingredientesAgrupados[$nombre])) {
                            $ingredientesAgrupados[$nombre] = 0;
                        }
                        $ingredientesAgrupados[$nombre] += $item->porciones;
                    }
                }
            }
        }

        // Crear items de la lista
        foreach ($ingredientesAgrupados as $ingrediente => $cantidad) {
            ShoppingListItem::create([
                'shopping_list_id' => $lista->id,
                'ingrediente' => $ingrediente,
                'cantidad' => $cantidad,
                'unidad' => 'unidad',
            ]);
        }

        return response()->json([
            'data' => $lista->load('items'),
            'message' => 'Lista de compras generada exitosamente',
        ], 201);
    }

    /**
     * Generar recetas personalizadas basadas en preferencias
     * Ahora genera solo 3 recetas máximo
     */
    private function generarRecetasPersonalizadas(MealPlan $plan)
    {
        // Obtener recetas filtradas
        $recetas = $this->filtrarRecetas($plan);

        if ($recetas->isEmpty()) {
            // Si no hay recetas, al menos crear estructura vacía
            return;
        }

        $recetasArray = $recetas->toArray();
        $diasAsignacion = ['lunes', 'martes', 'miercoles']; // Solo 3 días
        $comidaPrincipal = 'almuerzo'; // Asignar todas a almuerzo

        // Asignar solo 3 recetas máximo
        for ($i = 0; $i < min(3, count($recetasArray)); $i++) {
            $receta = $recetasArray[$i];
            MealPlanItem::create([
                'meal_plan_id' => $plan->id,
                'receta_id' => $receta['id'],
                'dia' => $diasAsignacion[$i],
                'comida' => $comidaPrincipal,
                'porciones' => 1,
            ]);
        }
    }

    /**
     * Filtrar recetas según preferencias del plan
     */
    private function filtrarRecetas(MealPlan $plan)
    {
        $query = Receta::query();

        // Filtrar por tipo de dieta
        if ($plan->estilo_comida !== 'mixta') {
            $query->where('tipo_dieta', $plan->estilo_comida);
        }

        // Filtrar por ingredientes a excluir (en JSON)
        if (!empty($plan->ingredientes_excluir)) {
            foreach ($plan->ingredientes_excluir as $ingrediente) {
                $query->where(function ($q) use ($ingrediente) {
                    $q->whereRaw("ingredientes NOT LIKE ?", ['%' . strtolower($ingrediente) . '%']);
                });
            }
        }

        // Filtrar por ingredientes a incluir (si especifica alguno)
        if (!empty($plan->ingredientes_incluir)) {
            $query->where(function ($q) use ($plan) {
                foreach ($plan->ingredientes_incluir as $ingrediente) {
                    $q->orWhereRaw("LOWER(ingredientes) LIKE ?", ['%' . strtolower($ingrediente) . '%']);
                }
            });
        }

        // Obtener resultado
        $resultado = $query->inRandomOrder()->limit(28)->get();

        // Si no hay recetas con el filtro de estilo, reintenta sin él
        if ($resultado->isEmpty() && $plan->estilo_comida !== 'mixta') {
            $query = Receta::query();

            if (!empty($plan->ingredientes_excluir)) {
                foreach ($plan->ingredientes_excluir as $ingrediente) {
                    $query->where(function ($q) use ($ingrediente) {
                        $q->whereRaw("ingredientes NOT LIKE ?", ['%' . strtolower($ingrediente) . '%']);
                    });
                }
            }

            if (!empty($plan->ingredientes_incluir)) {
                $query->where(function ($q) use ($plan) {
                    foreach ($plan->ingredientes_incluir as $ingrediente) {
                        $q->orWhereRaw("LOWER(ingredientes) LIKE ?", ['%' . strtolower($ingrediente) . '%']);
                    }
                });
            }

            $resultado = $query->inRandomOrder()->limit(28)->get();
        }

        // Si aún sin recetas, traer cualquier receta
        if ($resultado->isEmpty()) {
            $resultado = Receta::inRandomOrder()->limit(28)->get();
        }

        return $resultado;
    }
}
