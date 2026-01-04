<?php

namespace App\Http\Controllers;

use App\Models\Seguidor;
use App\Services\ExpoNotificationService;
use Illuminate\Http\Request;

class SeguidorController extends Controller
{
    /**
     * Seguir a un usuario
     */
    public function seguir(Request $request, $usuarioId)
    {
        try {
            $usuarioActual = $request->user();

            // No puede seguirse a sí mismo
            if ($usuarioActual->id == $usuarioId) {
                return response()->json([
                    'message' => 'No puedes seguirte a ti mismo',
                ], 422);
            }

            // Verificar que el usuario a seguir exista
            $usuario = \App\Models\User::find($usuarioId);
            if (!$usuario) {
                return response()->json([
                    'message' => 'Usuario no encontrado',
                ], 404);
            }

            // Verificar si ya lo sigue
            $yaSegue = Seguidor::where('usuario_id', $usuarioId)
                ->where('seguidor_id', $usuarioActual->id)
                ->exists();

            if ($yaSegue) {
                return response()->json([
                    'message' => 'Ya sigues a este usuario',
                ], 422);
            }

            // Crear el seguimiento
            Seguidor::create([
                'usuario_id' => $usuarioId,
                'seguidor_id' => $usuarioActual->id,
            ]);

            // Guardar notificación en BD
            \App\Models\Notification::create([
                'user_id' => $usuario->id,
                'from_user_id' => $usuarioActual->id,
                'type' => 'follow',
                'title' => '👥 ' . $usuarioActual->name . ' empezó a seguirte',
                'body' => 'Comparte tus recetas con ' . $usuarioActual->name,
            ]);

            // Enviar notificación push si tiene token registrado
            if ($usuario->expo_push_token) {
                ExpoNotificationService::notifyFollow(
                    $usuario->expo_push_token,
                    $usuarioActual->name,
                    $usuarioActual->id
                );
            }

            return response()->json([
                'message' => 'Siguiendo usuario',
                'following' => true,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al seguir usuario: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Dejar de seguir a un usuario
     */
    public function dejarDeSeguir(Request $request, $usuarioId)
    {
        try {
            $usuarioActual = $request->user();

            $seguimiento = Seguidor::where('usuario_id', $usuarioId)
                ->where('seguidor_id', $usuarioActual->id)
                ->first();

            if (!$seguimiento) {
                return response()->json([
                    'message' => 'No sigues a este usuario',
                ], 422);
            }

            $seguimiento->delete();

            return response()->json([
                'message' => 'Dejaste de seguir al usuario',
                'following' => false,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al dejar de seguir: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verificar si el usuario actual sigue a otro usuario
     */
    public function verificarSeguimiento(Request $request, $usuarioId)
    {
        try {
            $usuarioActual = $request->user();

            $siguiendo = Seguidor::where('usuario_id', $usuarioId)
                ->where('seguidor_id', $usuarioActual->id)
                ->exists();

            return response()->json([
                'following' => $siguiendo,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener seguidores de un usuario
     */
    public function obtenerSeguidores($usuarioId)
    {
        try {
            $seguidores = Seguidor::where('usuario_id', $usuarioId)
                ->with(['seguidor' => function ($query) {
                    $query->select('id', 'name', 'imagen_perfil', 'descripcion');
                }])
                ->get()
                ->map(fn($s) => $s->seguidor);

            return response()->json([
                'data' => $seguidores,
                'total' => count($seguidores),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener a quién sigue un usuario
     */
    public function obtenerSiguiendo($usuarioId)
    {
        try {
            $siguiendo = Seguidor::where('seguidor_id', $usuarioId)
                ->with(['usuario' => function ($query) {
                    $query->select('id', 'name', 'imagen_perfil', 'descripcion');
                }])
                ->get()
                ->map(fn($s) => $s->usuario);

            return response()->json([
                'data' => $siguiendo,
                'total' => count($siguiendo),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener información pública de un usuario con sus recetas
     */
    public function obtenerPerfilPublico($usuarioId)
    {
        try {
            $usuario = \App\Models\User::with(['recetas' => function ($query) {
                $query->latest();
            }])
            ->select('id', 'name', 'email', 'imagen_perfil', 'descripcion', 'created_at')
            ->find($usuarioId);

            if (!$usuario) {
                return response()->json([
                    'message' => 'Usuario no encontrado',
                ], 404);
            }

            // Contar seguidores
            $totalSeguidores = Seguidor::where('usuario_id', $usuarioId)->count();

            // Transformar recetas
            $recetasFormateadas = $usuario->recetas->map(function ($receta) {
                return [
                    'id' => $receta->id,
                    'titulo' => $receta->titulo,
                    'descripcion' => $receta->descripcion,
                    'imagen_url' => $receta->imagen_url,
                    'tiempo_preparacion' => $receta->tiempo_preparacion,
                    'dificultad' => $receta->dificultad,
                    'likes_count' => $receta->likes_count,
                    'comentarios_count' => $receta->comentarios_count,
                ];
            });

            return response()->json([
                'user' => [
                    'id' => $usuario->id,
                    'name' => $usuario->name,
                    'imagen_perfil' => $usuario->imagen_perfil,
                    'descripcion' => $usuario->descripcion,
                    'total_seguidores' => $totalSeguidores,
                    'total_recetas' => count($recetasFormateadas),
                ],
                'recetas' => $recetasFormateadas,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }
}

