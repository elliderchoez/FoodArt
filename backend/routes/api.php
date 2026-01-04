<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RecetaController;
use App\Http\Controllers\ComentarioController;
use App\Http\Controllers\SeguidorController;

// Rutas públicas de autenticación
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/upload-image', [AuthController::class, 'uploadImage']);

// Rutas públicas de recetas
Route::get('/recetas', [RecetaController::class, 'index']);
Route::get('/recetas/{id}', [RecetaController::class, 'show']);
Route::get('/recetas/search', [RecetaController::class, 'search']);
Route::get('/comentarios/{receta_id}', [ComentarioController::class, 'index']);

// Rutas públicas de usuarios
Route::get('/usuarios/{id}/perfil', [SeguidorController::class, 'obtenerPerfilPublico']);
Route::get('/usuarios/{id}/seguidores', [SeguidorController::class, 'obtenerSeguidores']);
Route::get('/usuarios/{id}/siguiendo', [SeguidorController::class, 'obtenerSiguiendo']);

// Rutas protegidas (requieren token)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/user/update-profile', [AuthController::class, 'updateProfile']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Recetas
    Route::post('/recetas', [RecetaController::class, 'store']);
    Route::put('/recetas/{id}', [RecetaController::class, 'update']);
    Route::delete('/recetas/{id}', [RecetaController::class, 'destroy']);
    Route::post('/recetas/{id}/like', [RecetaController::class, 'like']);
    Route::post('/recetas/{id}/save', [RecetaController::class, 'save']);
    Route::get('/user/recetas', [RecetaController::class, 'userRecetas']);
    Route::get('/user/recetas-guardadas', [RecetaController::class, 'savedRecetas']);
    Route::get('/user/recetas-con-like', [RecetaController::class, 'likedRecetas']);

    // Comentarios
    Route::post('/comentarios/{receta_id}', [ComentarioController::class, 'store']);
    Route::delete('/comentarios/{id}', [ComentarioController::class, 'destroy']);

    // Seguidores
    Route::post('/usuarios/{id}/seguir', [SeguidorController::class, 'seguir']);
    Route::post('/usuarios/{id}/dejar-de-seguir', [SeguidorController::class, 'dejarDeSeguir']);
    Route::get('/usuarios/{id}/verificar-seguimiento', [SeguidorController::class, 'verificarSeguimiento']);

    // Notificaciones
    Route::post('/notifications/register-token', [AuthController::class, 'registerNotificationToken']);
    Route::post('/notifications/send-test', [AuthController::class, 'sendTestNotification']);
    Route::get('/notifications', [AuthController::class, 'getNotifications']);
    Route::put('/notifications/{id}/read', [AuthController::class, 'markNotificationAsRead']);
    Route::delete('/notifications/{id}', [AuthController::class, 'deleteNotification']);
});

