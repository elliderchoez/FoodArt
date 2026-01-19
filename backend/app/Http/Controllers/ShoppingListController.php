<?php

namespace App\Http\Controllers;

use App\Models\ShoppingList;
use App\Models\ShoppingListItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ShoppingListController extends Controller
{
    /**
     * Obtener todas las listas del usuario
     */
    public function index()
    {
        $listas = Auth::user()
            ->shoppingLists()
            ->with('items')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($lista) {
                return [
                    ...$lista->toArray(),
                    'total_estimado' => $lista->obtenerTotalEstimado(),
                    'total_gastado' => $lista->obtenerTotalGastado(),
                    'progreso' => $lista->obtenerProgreso(),
                ];
            });

        return response()->json([
            'data' => $listas,
        ]);
    }

    /**
     * Crear nueva lista
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'fecha_objetivo' => 'nullable|date',
        ]);

        $lista = Auth::user()->shoppingLists()->create($validated);

        return response()->json([
            'data' => $lista,
            'message' => 'Lista de compras creada',
        ], 201);
    }

    /**
     * Obtener detalle de una lista
     */
    public function show(ShoppingList $shoppingList)
    {
        if ($shoppingList->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        return response()->json([
            'data' => $shoppingList->load('items'),
            'total_estimado' => $shoppingList->obtenerTotalEstimado(),
            'total_gastado' => $shoppingList->obtenerTotalGastado(),
            'progreso' => $shoppingList->obtenerProgreso(),
        ]);
    }

    /**
     * Actualizar lista
     */
    public function update(Request $request, ShoppingList $shoppingList)
    {
        if ($shoppingList->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'descripcion' => 'nullable|string',
            'estado' => 'sometimes|in:pendiente,en_progreso,completada',
            'fecha_objetivo' => 'nullable|date',
        ]);

        $shoppingList->update($validated);

        return response()->json([
            'data' => $shoppingList,
            'message' => 'Lista actualizada',
        ]);
    }

    /**
     * Eliminar lista
     */
    public function destroy(ShoppingList $shoppingList)
    {
        if ($shoppingList->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $shoppingList->delete();

        return response()->json([
            'message' => 'Lista eliminada',
        ]);
    }

    /**
     * Agregar item a la lista
     */
    public function agregarItem(Request $request, ShoppingList $shoppingList)
    {
        if ($shoppingList->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'ingrediente' => 'required|string|max:255',
            'cantidad' => 'required|numeric|min:0.1',
            'unidad' => 'required|string|max:50',
            'precio_estimado' => 'nullable|numeric|min:0',
            'notas' => 'nullable|string',
        ]);

        $item = $shoppingList->items()->create($validated);

        return response()->json([
            'data' => $item,
            'message' => 'Item agregado a la lista',
        ], 201);
    }

    /**
     * Actualizar item
     */
    public function actualizarItem(Request $request, ShoppingList $shoppingList, ShoppingListItem $item)
    {
        if ($shoppingList->user_id !== Auth::id() || $item->shopping_list_id !== $shoppingList->id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'ingrediente' => 'sometimes|string|max:255',
            'cantidad' => 'sometimes|numeric|min:0.1',
            'unidad' => 'sometimes|string|max:50',
            'precio_estimado' => 'nullable|numeric|min:0',
            'comprado' => 'sometimes|boolean',
            'notas' => 'nullable|string',
        ]);

        $item->update($validated);

        return response()->json([
            'data' => $item,
            'message' => 'Item actualizado',
        ]);
    }

    /**
     * Marcar item como comprado
     */
    public function marcarComprado(ShoppingList $shoppingList, ShoppingListItem $item)
    {
        if ($shoppingList->user_id !== Auth::id() || $item->shopping_list_id !== $shoppingList->id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $item->marcarComprado();

        return response()->json([
            'data' => $item,
            'message' => 'Item marcado como comprado',
        ]);
    }

    /**
     * Desmarcar item
     */
    public function desmarcarComprado(ShoppingList $shoppingList, ShoppingListItem $item)
    {
        if ($shoppingList->user_id !== Auth::id() || $item->shopping_list_id !== $shoppingList->id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $item->marcarNoComprado();

        return response()->json([
            'data' => $item,
            'message' => 'Item desmarcado',
        ]);
    }

    /**
     * Eliminar item
     */
    public function eliminarItem(ShoppingList $shoppingList, ShoppingListItem $item)
    {
        if ($shoppingList->user_id !== Auth::id() || $item->shopping_list_id !== $shoppingList->id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $item->delete();

        return response()->json([
            'message' => 'Item eliminado',
        ]);
    }
}
