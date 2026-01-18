<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\RecetaCategoria;
use App\Models\Resena;
use App\Models\Mensaje;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    /**
     * Cambiar contraseña del usuario autenticado
     */
    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Contraseña actual incorrecta',
            ], 401);
        }

        $user->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        return response()->json([
            'message' => 'Contraseña cambiada exitosamente',
        ], 200);
    }

    /**
     * Eliminar cuenta del usuario
     */
    public function deleteAccount(Request $request)
    {
        $validated = $request->validate([
            'password' => 'required|string',
            'confirmation' => 'required|in:delete',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Contraseña incorrecta',
            ], 401);
        }

        // Eliminar todos los tokens del usuario
        $user->tokens()->delete();

        // Eliminar el usuario
        $user->delete();

        return response()->json([
            'message' => 'Cuenta eliminada exitosamente',
        ], 200);
    }

    /**
     * Guardar receta en categoría
     */
    public function saveRecetaInCategory(Request $request, $recetaId)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'descripcion' => 'nullable|string|max:500',
        ]);

        $usuario = $request->user();

        // Verificar si ya existe
        $existe = RecetaCategoria::where('user_id', $usuario->id)
            ->where('receta_id', $recetaId)
            ->first();

        if ($existe) {
            return response()->json([
                'message' => 'La receta ya está guardada',
                'data' => $existe
            ], 200);
        }

        $categoria = RecetaCategoria::create([
            'user_id' => $usuario->id,
            'receta_id' => $recetaId,
            'nombre' => $validated['nombre'],
            'descripcion' => $validated['descripcion'] ?? null,
        ]);

        return response()->json([
            'message' => 'Receta guardada en categoría',
            'data' => $categoria
        ], 201);
    }

    /**
     * Obtener recetas guardadas por categoría
     */
    public function getRecetasCategorias(Request $request)
    {
        $usuario = $request->user();

        $categorias = RecetaCategoria::where('user_id', $usuario->id)
            ->with('receta')
            ->get();

        return response()->json([
            'message' => 'Categorías obtenidas',
            'data' => $categorias
        ], 200);
    }

    /**
     * Actualizar nombre de categoría
     */
    public function updateCategoryName(Request $request, $categoriaId)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'descripcion' => 'nullable|string|max:500',
        ]);

        $categoria = RecetaCategoria::findOrFail($categoriaId);

        // Verificar que sea del usuario autenticado
        if ($categoria->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'No tienes permiso para editar esta categoría',
            ], 403);
        }

        $categoria->update($validated);

        return response()->json([
            'message' => 'Categoría actualizada',
            'data' => $categoria
        ], 200);
    }

    /**
     * Eliminar categoría
     */
    public function deleteCategory($categoriaId)
    {
        $categoria = RecetaCategoria::findOrFail($categoriaId);

        // Verificar que sea del usuario autenticado
        if ($categoria->user_id !== auth()->id()) {
            return response()->json([
                'message' => 'No tienes permiso para eliminar esta categoría',
            ], 403);
        }

        $categoria->delete();

        return response()->json([
            'message' => 'Categoría eliminada',
        ], 200);
    }

    // ========== RESEÑAS ==========

    /**
     * Crear o actualizar reseña
     */
    public function crearResena(Request $request, $recetaId)
    {
        $validated = $request->validate([
            'calificacion' => 'required|integer|min:1|max:5',
            'texto' => 'nullable|string|max:1000',
        ]);

        $usuario = $request->user();

        $resena = Resena::updateOrCreate(
            [
                'receta_id' => $recetaId,
                'user_id' => $usuario->id,
            ],
            [
                'calificacion' => $validated['calificacion'],
                'texto' => $validated['texto'] ?? null,
            ]
        );

        return response()->json([
            'message' => 'Reseña guardada',
            'data' => $resena
        ], 201);
    }

    /**
     * Obtener reseñas de una receta
     */
    public function getResenas($recetaId)
    {
        $resenas = Resena::where('receta_id', $recetaId)
            ->with('usuario')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'message' => 'Reseñas obtenidas',
            'data' => $resenas
        ], 200);
    }

    /**
     * Eliminar reseña
     */
    public function deleteResena($resenaId)
    {
        $resena = Resena::findOrFail($resenaId);

        if ($resena->user_id !== auth()->id()) {
            return response()->json([
                'message' => 'No tienes permiso para eliminar esta reseña',
            ], 403);
        }

        $resena->delete();

        return response()->json([
            'message' => 'Reseña eliminada',
        ], 200);
    }

    // ========== MENSAJERÍA ==========

    /**
     * Enviar mensaje
     */
    public function enviarMensaje(Request $request)
    {
        $validated = $request->validate([
            'destinatario_id' => 'required|exists:users,id',
            'contenido' => 'required|string|max:1000',
        ]);

        $remitente = $request->user();

        if ($remitente->id === $validated['destinatario_id']) {
            return response()->json([
                'message' => 'No puedes enviarte mensajes a ti mismo',
            ], 400);
        }

        $mensaje = Mensaje::create([
            'remitente_id' => $remitente->id,
            'destinatario_id' => $validated['destinatario_id'],
            'contenido' => $validated['contenido'],
        ]);

        return response()->json([
            'message' => 'Mensaje enviado',
            'data' => $mensaje->load('remitente', 'destinatario')
        ], 201);
    }

    /**
     * Obtener conversación con un usuario
     */
    public function getConversacion($usuarioId)
    {
        $usuarioActual = auth()->id();

        $mensajes = Mensaje::where(function ($query) use ($usuarioActual, $usuarioId) {
            $query->where('remitente_id', $usuarioActual)
                  ->where('destinatario_id', $usuarioId);
        })->orWhere(function ($query) use ($usuarioActual, $usuarioId) {
            $query->where('remitente_id', $usuarioId)
                  ->where('destinatario_id', $usuarioActual);
        })
        ->with('remitente', 'destinatario')
        ->orderBy('created_at', 'asc')
        ->paginate(50);

        // Marcar como leídos los mensajes recibidos
        Mensaje::where('destinatario_id', $usuarioActual)
            ->where('remitente_id', $usuarioId)
            ->where('leido', false)
            ->update(['leido' => true, 'leido_at' => now()]);

        return response()->json([
            'message' => 'Conversación obtenida',
            'data' => $mensajes
        ], 200);
    }

    /**
     * Obtener lista de conversaciones
     */
    public function getConversaciones()
    {
        $usuarioActual = auth()->id();

        // Obtener todos los usuarios con los que ha intercambiado mensajes
        $usuarios = Mensaje::where(function ($query) use ($usuarioActual) {
            $query->where('remitente_id', $usuarioActual)
                  ->orWhere('destinatario_id', $usuarioActual);
        })
        ->with(['remitente', 'destinatario'])
        ->latest()
        ->get()
        ->map(function ($mensaje) use ($usuarioActual) {
            return $mensaje->remitente_id === $usuarioActual
                ? $mensaje->destinatario
                : $mensaje->remitente;
        })
        ->unique('id')
        ->values();

        return response()->json([
            'message' => 'Conversaciones obtenidas',
            'data' => $usuarios
        ], 200);
    }

    /**
     * Contar mensajes sin leer
     */
    public function countMensajesSinLeer()
    {
        $count = Mensaje::where('destinatario_id', auth()->id())
            ->where('leido', false)
            ->count();

        return response()->json([
            'message' => 'Mensajes sin leer',
            'count' => $count
        ], 200);
    }

    /**
     * Filtros avanzados de recetas
     */
    public function filtrarRecetas(Request $request)
    {
        $validated = $request->validate([
            'dificultad' => 'nullable|in:Fácil,Media,Difícil',
            'tiempo_max' => 'nullable|integer|min:1',
            'ingredientes' => 'nullable|array',
            'dieta' => 'nullable|string',
        ]);

        $query = \App\Models\Receta::query();

        if (isset($validated['dificultad'])) {
            $query->where('dificultad', $validated['dificultad']);
        }

        if (isset($validated['tiempo_max'])) {
            // Buscar en el campo tiempo_preparacion
            $query->whereRaw('CAST(REPLACE(tiempo_preparacion, \" min\", \"\") AS UNSIGNED) <= ?',
                [$validated['tiempo_max']]);
        }

        if (isset($validated['ingredientes']) && !empty($validated['ingredientes'])) {
            foreach ($validated['ingredientes'] as $ingrediente) {
                $query->whereJsonContains('ingredientes', ['nombre' => $ingrediente]);
            }
        }

        $recetas = $query->with('user')->paginate(15);

        return response()->json([
            'message' => 'Recetas filtradas',
            'data' => $recetas
        ], 200);
    }
}
