<?php

namespace App\Http\Controllers;

use App\Models\Receta;
use App\Models\Like;
use App\Models\Comentario;
use App\Models\RecetaGuardada;
use App\Services\ExpoNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RecetaController extends Controller
{
    /**
     * Obtener todas las recetas (feed)
     */
    public function index(Request $request)
    {
        try {
            $perPage = (int) $request->query('per_page', 10);
            $perPage = max(1, min($perPage, 50));

            $recetas = Receta::with(['user'])
                ->latest()
                ->paginate($perPage);

            // Obtener el usuario si está autenticado
            $user = null;
            if ($request->bearerToken()) {
                try {
                    $token = \Laravel\Sanctum\PersonalAccessToken::findToken($request->bearerToken());
                    if ($token) {
                        $user = $token->tokenable;
                    }
                } catch (\Exception $e) {
                    // Token no válido, continuar sin usuario
                }
            }

            // Transformar recetas para incluir user_liked y user_saved
            $recetas->getCollection()->transform(function($receta) use ($user) {
                $receta->user_liked = false;
                $receta->user_saved = false;

                if ($user) {
                    $receta->user_liked = Like::where('user_id', $user->id)
                        ->where('receta_id', $receta->id)
                        ->exists();

                    $receta->user_saved = RecetaGuardada::where('user_id', $user->id)
                        ->where('receta_id', $receta->id)
                        ->exists();
                }

                return $receta;
            });

            return response()->json($recetas, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener recetas: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Crear una nueva receta
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'titulo' => 'required|string|max:255',
                'descripcion' => 'required|string|max:1000',
                'imagen_url' => 'required|string|url',
                'tiempo_preparacion' => 'nullable|string|max:50',
                'porciones' => 'required|integer|min:1',
                'dificultad' => 'required|in:Fácil,Media,Difícil',
                'ingredientes' => 'required|array',
                'pasos' => 'required|array',
                'tipo_dieta' => 'nullable|in:vegana,vegetariana,carnes,gym,mixta,bajar_peso',
            ]);

            $receta = Receta::create([
                'user_id' => $request->user()->id,
                'titulo' => $validated['titulo'],
                'descripcion' => $validated['descripcion'],
                'imagen_url' => $validated['imagen_url'],
                'tiempo_preparacion' => $validated['tiempo_preparacion'],
                'porciones' => $validated['porciones'],
                'dificultad' => $validated['dificultad'],
                'ingredientes' => $validated['ingredientes'],
                'pasos' => $validated['pasos'],
                'tipo_dieta' => $validated['tipo_dieta'] ?? 'mixta',
            ]);

            return response()->json([
                'message' => 'Receta creada exitosamente',
                'receta' => $receta->load('user'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear receta: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Obtener una receta específica
     */
    public function show(Request $request, $id)
    {
        try {
            $receta = Receta::with(['user', 'comentarios.user'])->find($id);

            if (!$receta) {
                return response()->json(['message' => 'Receta no encontrada'], 404);
            }

            // Intentar obtener el usuario del header Authorization
            // Incluso en rutas públicas, Sanctum puede procesar el token
            $user = null;
            $authHeader = $request->header('Authorization');

            if ($authHeader && strpos($authHeader, 'Bearer ') === 0) {
                $token = substr($authHeader, 7);
                $personalAccessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);

                if ($personalAccessToken) {
                    $user = $personalAccessToken->tokenable;
                }
            }

            // Verificar si el usuario actual ya le dio like y si la guardó
            if ($user) {
                $receta->user_liked = Like::where('user_id', $user->id)
                    ->where('receta_id', $id)
                    ->exists();

                $receta->user_saved = RecetaGuardada::where('user_id', $user->id)
                    ->where('receta_id', $id)
                    ->exists();

                // Verificar si sigue al autor de la receta
                $receta->user_follows_author = \App\Models\Seguidor::where('usuario_id', $receta->user_id)
                    ->where('seguidor_id', $user->id)
                    ->exists();

                $receta->is_own_recipe = ($user->id === $receta->user_id);
            } else {
                $receta->user_liked = false;
                $receta->user_saved = false;
                $receta->user_follows_author = false;
                $receta->is_own_recipe = false;
            }

            // Contar seguidores del autor
            $receta->user->total_followers = \App\Models\Seguidor::where('usuario_id', $receta->user_id)->count();

            return response()->json($receta, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener receta: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Actualizar una receta
     */
    public function update(Request $request, $id)
    {
        try {
            $receta = Receta::find($id);

            if (!$receta) {
                return response()->json(['message' => 'Receta no encontrada'], 404);
            }

            // Verificar que el usuario sea el propietario
            if ($receta->user_id !== $request->user()->id) {
                return response()->json(['message' => 'No tienes permiso para editar esta receta'], 403);
            }

            $validated = $request->validate([
                'titulo' => 'sometimes|string|max:255',
                'descripcion' => 'sometimes|string|max:1000',
                'imagen_url' => 'sometimes|string|url',
                'tiempo_preparacion' => 'nullable|string|max:50',
                'porciones' => 'sometimes|integer|min:1',
                'dificultad' => 'sometimes|in:Fácil,Media,Difícil',
                'ingredientes' => 'sometimes|array',
                'pasos' => 'sometimes|array',
                'tipo_dieta' => 'nullable|in:vegana,vegetariana,carnes,gym,mixta,bajar_peso',
            ]);

            $receta->update($validated);

            return response()->json([
                'message' => 'Receta actualizada exitosamente',
                'receta' => $receta->load('user'),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar receta: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Eliminar una receta
     */
    public function destroy($id, Request $request)
    {
        try {
            $receta = Receta::find($id);

            if (!$receta) {
                return response()->json(['message' => 'Receta no encontrada'], 404);
            }

            // Verificar que el usuario sea el propietario
            if ($receta->user_id !== $request->user()->id) {
                return response()->json(['message' => 'No tienes permiso para eliminar esta receta'], 403);
            }

            $receta->delete();

            return response()->json([
                'message' => 'Receta eliminada exitosamente',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar receta: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Dar like a una receta
     */
    public function like($id, Request $request)
    {
        try {
            $receta = Receta::find($id);

            if (!$receta) {
                return response()->json(['message' => 'Receta no encontrada'], 404);
            }

            $userId = $request->user()->id;
            $currentUser = $request->user();

            // Verificar si ya existe el like
            $like = Like::where('user_id', $userId)->where('receta_id', $id)->first();

            if ($like) {
                $like->delete();
                $receta->decrement('likes_count');
                return response()->json([
                    'message' => 'Like eliminado',
                    'liked' => false,
                    'likes_count' => $receta->likes_count,
                ], 200);
            } else {
                Like::create([
                    'user_id' => $userId,
                    'receta_id' => $id,
                ]);
                $receta->increment('likes_count');

                // Enviar notificación al autor de la receta (si tiene token registrado)
                $recetaAuthor = $receta->user;
                if ($recetaAuthor) {
                    // Guardar en BD
                    \App\Models\Notification::create([
                        'user_id' => $recetaAuthor->id,
                        'from_user_id' => $currentUser->id,
                        'type' => 'like',
                        'title' => '❤️ ' . $currentUser->name . ' dio like',
                        'body' => 'Le gustó tu receta: ' . $receta->titulo,
                        'recipe_id' => $receta->id,
                    ]);

                    // Enviar push si tiene token
                    if ($recetaAuthor->expo_push_token) {
                        ExpoNotificationService::notifyLike(
                            $recetaAuthor->expo_push_token,
                            $currentUser->name,
                            $receta->titulo,
                            $receta->id
                        );
                    }
                }

                return response()->json([
                    'message' => 'Like agregado',
                    'liked' => true,
                    'likes_count' => $receta->likes_count,
                ], 200);
            }
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al dar like: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Guardar una receta
     */
    public function save($id, Request $request)
    {
        try {
            $receta = Receta::find($id);

            if (!$receta) {
                return response()->json(['message' => 'Receta no encontrada'], 404);
            }

            $userId = $request->user()->id;

            // Verificar si ya está guardada
            $guardada = RecetaGuardada::where('user_id', $userId)->where('receta_id', $id)->first();

            if ($guardada) {
                $guardada->delete();
                return response()->json([
                    'message' => 'Receta desguardada',
                    'saved' => false,
                ], 200);
            } else {
                RecetaGuardada::create([
                    'user_id' => $userId,
                    'receta_id' => $id,
                ]);
                return response()->json([
                    'message' => 'Receta guardada',
                    'saved' => true,
                ], 200);
            }
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al guardar receta: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Obtener recetas guardadas del usuario
     */
    public function savedRecetas(Request $request)
    {
        try {
            $recetas = RecetaGuardada::where('user_id', $request->user()->id)
                ->with('receta.user')
                ->latest()
                ->get()
                ->pluck('receta');

            return response()->json($recetas, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener recetas guardadas: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Obtener recetas del usuario actual
     */
    public function userRecetas(Request $request)
    {
        try {
            $recetas = Receta::where('user_id', $request->user()->id)
                ->latest()
                ->get();

            return response()->json($recetas, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener recetas del usuario: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Buscar recetas
     */
    public function search(Request $request)
    {
        try {
            $query = $request->query('q', '');
            $dificultad = $request->query('dificultad');
            $tiempo_max = $request->query('tiempo_max');
            $orden = $request->query('orden', 'recent'); // recent, popular

            $recetas = Receta::query();

            $driver = $recetas->getConnection()->getDriverName();

            if ($query) {
                $q = mb_strtolower($query);
                $recetas->where(function ($sub) use ($q, $driver) {
                    // PostgreSQL soporta ILIKE, pero lo mantenemos compatible
                    if ($driver === 'pgsql') {
                        $sub->where('titulo', 'ILIKE', "%{$q}%")
                            ->orWhere('descripcion', 'ILIKE', "%{$q}%");
                        return;
                    }

                    $sub->whereRaw('LOWER(titulo) LIKE ?', ["%{$q}%"])
                        ->orWhereRaw('LOWER(descripcion) LIKE ?', ["%{$q}%"]);
                });
            }

            if ($dificultad && $dificultad !== 'Cualquiera') {
                $recetas->where('dificultad', $dificultad);
            }

            if ($tiempo_max) {
                // Guardamos tiempo_preparacion como string; tratamos de castearlo a número según motor.
                if ($driver === 'mysql') {
                    $recetas->whereRaw('CAST(tiempo_preparacion AS UNSIGNED) <= ?', [$tiempo_max]);
                } elseif ($driver === 'pgsql') {
                    $recetas->whereRaw('CAST(tiempo_preparacion AS INTEGER) <= ?', [$tiempo_max]);
                } else {
                    // Fallback (sqlite/otros): intenta comparar como texto numérico simple
                    $recetas->where('tiempo_preparacion', '<=', (string) $tiempo_max);
                }
            }

            if ($orden === 'popular') {
                $recetas->orderBy('likes_count', 'desc');
            } else {
                $recetas->latest();
            }

            $resultados = $recetas->with('user')->paginate(15);

            return response()->json($resultados, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al buscar recetas: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Obtener recetas con like del usuario actual
     */
    public function likedRecetas(Request $request)
    {
        try {
            $recetas = Like::where('user_id', $request->user()->id)
                ->with('receta.user')
                ->latest()
                ->get()
                ->pluck('receta');

            return response()->json($recetas, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener recetas con like: ' . $e->getMessage(),
            ], 400);
        }
    }
}
