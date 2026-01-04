<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Registro de usuario
     */
    public function register(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users|max:255',
                'password' => 'required|string|min:6|confirmed',
                'descripcion' => 'nullable|string|max:500',
                'imagen_perfil' => 'nullable|string|url', // Aceptar URL en lugar de archivo
            ]);

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'descripcion' => $validated['descripcion'] ?? null,
                'imagen_perfil' => $validated['imagen_perfil'] ?? null,
            ]);

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Usuario registrado exitosamente',
                'token' => $token,
                'user' => $user,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al registrar: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Login de usuario
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'Usuario no encontrado',
            ], 404);
        }

        if (!Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Contraseña incorrecta',
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login exitoso',
            'token' => $token,
            'user' => $user,
        ], 200);
    }

    /**
     * Obtener usuario autenticado
     */
    public function user(Request $request)
    {
        return response()->json($request->user(), 200);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout exitoso',
        ], 200);
    }

    /**
     * Actualizar perfil del usuario
     */
    public function updateProfile(Request $request)
    {
        try {
            $user = $request->user();

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $user->id . '|max:255',
                'descripcion' => 'nullable|string|max:500',
                'imagen_perfil' => 'nullable|string|url',
            ]);

            $user->update($validated);

            return response()->json([
                'message' => 'Perfil actualizado exitosamente',
                'user' => $user,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar perfil: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Cambiar contraseña
     */
    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Contraseña actual incorrecta',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => 'Contraseña actualizada exitosamente',
        ], 200);
    }

    /**
     * Subir imagen de perfil
     */
    public function uploadImage(Request $request)
    {
        try {
            $validated = $request->validate([
                'image' => 'required|image|mimes:jpeg,jpg,png,gif,webp|max:5120',
            ]);

            if (!$request->hasFile('image')) {
                return response()->json(['message' => 'No file uploaded'], 400);
            }

            $file = $request->file('image');

            if (!$file->isValid()) {
                return response()->json(['message' => 'Invalid file'], 400);
            }

            // Guardar en public/uploads para acceso directo
            $fileName = 'receta_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads'), $fileName);

            $fullUrl = url('/uploads/' . $fileName);

            return response()->json([
                'url' => $fullUrl,
                'message' => 'Image uploaded successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error uploading image: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Recuperar contraseña (enviar email)
     */
    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|exists:users',
        ]);

        // Aquí iría la lógica para enviar email de recuperación
        // Por ahora, solo devolvemos un mensaje

        return response()->json([
            'message' => 'Se ha enviado un enlace de recuperación a tu email',
        ], 200);
    }

    /**
     * Registrar token de notificación del dispositivo
     */
    public function registerNotificationToken(Request $request)
    {
        try {
            $validated = $request->validate([
                'token' => 'required|string',
            ]);

            $user = $request->user();
            $user->expo_push_token = $validated['token'];
            $user->save();

            return response()->json([
                'message' => 'Token registrado exitosamente',
                'token' => $user->expo_push_token,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error registrando token: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Enviar notificación de prueba
     */
    public function sendTestNotification(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->expo_push_token) {
                return response()->json([
                    'message' => 'El usuario no tiene token de notificación registrado',
                ], 400);
            }

            return response()->json([
                'message' => 'Este endpoint solo está disponible en ambiente de prueba',
            ], 403);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Obtener notificaciones del usuario
     */
    public function getNotifications(Request $request)
    {
        try {
            $user = $request->user();

            $notifications = \App\Models\Notification::where('user_id', $user->id)
                ->with('fromUser')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($notification) {
                    return [
                        'id' => $notification->id,
                        'title' => $notification->title,
                        'body' => $notification->body,
                        'type' => $notification->type,
                        'read' => $notification->read,
                        'timestamp' => $notification->created_at,
                        'data' => [
                            'type' => $notification->type,
                            'recipeId' => $notification->recipe_id,
                            'userId' => $notification->from_user_id,
                            'userName' => $notification->fromUser->name ?? null,
                        ]
                    ];
                });

            return response()->json($notifications, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error obteniendo notificaciones: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Marcar notificación como leída
     */
    public function markNotificationAsRead(Request $request, $id)
    {
        try {
            $notification = \App\Models\Notification::findOrFail($id);

            // Verificar que sea del usuario
            if ($notification->user_id !== $request->user()->id) {
                return response()->json(['message' => 'No tienes permiso'], 403);
            }

            $notification->update(['read' => true]);

            return response()->json(['message' => 'Notificación marcada como leída'], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Eliminar notificación
     */
    public function deleteNotification(Request $request, $id)
    {
        try {
            $notification = \App\Models\Notification::findOrFail($id);

            // Verificar que sea del usuario
            if ($notification->user_id !== $request->user()->id) {
                return response()->json(['message' => 'No tienes permiso'], 403);
            }

            $notification->delete();

            return response()->json(['message' => 'Notificación eliminada'], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
            ], 400);
        }
    }
}
