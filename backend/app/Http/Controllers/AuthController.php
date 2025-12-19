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

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciales inválidas'],
            ]);
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

            $path = $file->store('perfil', 'public');
            $fullUrl = url(Storage::url($path));

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
}
