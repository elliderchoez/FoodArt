<?php

namespace App\Http\Controllers;

use App\Models\Comentario;
use App\Models\Receta;
use Illuminate\Http\Request;

class ComentarioController extends Controller
{
    /**
     * Obtener comentarios de una receta
     */
    public function index($receta_id)
    {
        try {
            $comentarios = Comentario::where('receta_id', $receta_id)
                ->with('user')
                ->latest()
                ->get();

            return response()->json($comentarios, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener comentarios: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Crear un comentario
     */
    public function store(Request $request, $receta_id)
    {
        try {
            $receta = Receta::find($receta_id);

            if (!$receta) {
                return response()->json(['message' => 'Receta no encontrada'], 404);
            }

            $validated = $request->validate([
                'contenido' => 'required|string|max:500',
                'calificacion' => 'nullable|integer|min:1|max:5',
            ]);

            $comentario = Comentario::create([
                'user_id' => $request->user()->id,
                'receta_id' => $receta_id,
                'contenido' => $validated['contenido'],
                'calificacion' => $validated['calificacion'],
            ]);

            $receta->increment('comentarios_count');

            return response()->json([
                'message' => 'Comentario creado exitosamente',
                'comentario' => $comentario->load('user'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear comentario: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Eliminar un comentario
     */
    public function destroy($id, Request $request)
    {
        try {
            $comentario = Comentario::find($id);

            if (!$comentario) {
                return response()->json(['message' => 'Comentario no encontrado'], 404);
            }

            // Verificar que el usuario sea el propietario
            if ($comentario->user_id !== $request->user()->id) {
                return response()->json(['message' => 'No tienes permiso para eliminar este comentario'], 403);
            }

            $receta_id = $comentario->receta_id;
            $comentario->delete();

            // Decrementar contador
            Receta::find($receta_id)->decrement('comentarios_count');

            return response()->json([
                'message' => 'Comentario eliminado exitosamente',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar comentario: ' . $e->getMessage(),
            ], 400);
        }
    }
}
