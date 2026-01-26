<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RecetaController;
use App\Http\Controllers\ComentarioController;
use App\Http\Controllers\SeguidorController;
use App\Http\Controllers\RatingController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\MensajeController;
use App\Http\Controllers\MealPlanController;
use App\Http\Controllers\ShoppingListController;
use Illuminate\Support\Facades\Http;

// Rutas públicas de autenticación
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'requestPasswordReset']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/upload-image', [AuthController::class, 'uploadImage']);

// Rutas públicas de recetas
Route::get('/recetas', [RecetaController::class, 'index']);
Route::get('/recetas/search', [RecetaController::class, 'search']);
Route::get('/recetas/{id}', [RecetaController::class, 'show']);
Route::get('/recetas/{id}/rating', [RatingController::class, 'show']);
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
    Route::post('/recetas/{id}/rating', [RatingController::class, 'store']);
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

    // ========== RUTAS DE USUARIO ==========

    // Perfil y seguridad
    Route::post('/user/change-password', [UserController::class, 'changePassword']);
    Route::post('/user/delete-account', [UserController::class, 'deleteAccount']);

    // Categorías de recetas
    Route::post('/recetas/{id}/categorizar', [UserController::class, 'saveRecetaInCategory']);
    Route::get('/user/recetas-categorias', [UserController::class, 'getRecetasCategorias']);
    Route::put('/receta-categorias/{id}', [UserController::class, 'updateCategoryName']);
    Route::delete('/receta-categorias/{id}', [UserController::class, 'deleteCategory']);

    // Reseñas
    Route::post('/recetas/{id}/resenas', [UserController::class, 'crearResena']);
    Route::delete('/resenas/{id}', [UserController::class, 'deleteResena']);

    // Mensajería
    Route::get('/mensajes/conversaciones', [MensajeController::class, 'conversaciones']);
    Route::get('/mensajes/{usuarioId}', [MensajeController::class, 'obtenerMensajes']);
    Route::post('/mensajes/{usuarioId}/enviar', [MensajeController::class, 'enviarMensaje']);
    Route::post('/mensajes/{usuarioId}/marcar-leidos', [MensajeController::class, 'marcarLeidos']);

    // Planes de Comidas
    Route::get('/meal-plans', [MealPlanController::class, 'index']);
    Route::post('/meal-plans', [MealPlanController::class, 'store']);
    Route::get('/meal-plans/{mealPlan}', [MealPlanController::class, 'show']);
    Route::put('/meal-plans/{mealPlan}', [MealPlanController::class, 'update']);
    Route::delete('/meal-plans/{mealPlan}', [MealPlanController::class, 'destroy']);
    Route::post('/meal-plans/{mealPlan}/recetas', [MealPlanController::class, 'agregarReceta']);
    Route::delete('/meal-plans/{mealPlan}/items/{item}', [MealPlanController::class, 'removerReceta']);
    Route::post('/meal-plans/{mealPlan}/generar-lista', [MealPlanController::class, 'generarListaCompras']);

    // Listas de Compras
    Route::get('/shopping-lists', [ShoppingListController::class, 'index']);
    Route::post('/shopping-lists', [ShoppingListController::class, 'store']);
    Route::get('/shopping-lists/{shoppingList}', [ShoppingListController::class, 'show']);
    Route::put('/shopping-lists/{shoppingList}', [ShoppingListController::class, 'update']);
    Route::delete('/shopping-lists/{shoppingList}', [ShoppingListController::class, 'destroy']);
    Route::post('/shopping-lists/{shoppingList}/items', [ShoppingListController::class, 'agregarItem']);
    Route::put('/shopping-lists/{shoppingList}/items/{item}', [ShoppingListController::class, 'actualizarItem']);
    Route::post('/shopping-lists/{shoppingList}/items/{item}/marcar-comprado', [ShoppingListController::class, 'marcarComprado']);
    Route::post('/shopping-lists/{shoppingList}/items/{item}/desmarcar', [ShoppingListController::class, 'desmarcarComprado']);
    Route::delete('/shopping-lists/{shoppingList}/items/{item}', [ShoppingListController::class, 'eliminarItem']);

    // Filtros avanzados
    Route::get('/recetas/filtrar/avanzado', [UserController::class, 'filtrarRecetas']);


    // ========== RUTAS DE ADMIN ==========
    Route::middleware('admin')->group(function () {
        // Usuarios
        Route::get('/admin/usuarios', [AdminController::class, 'getUsuarios']);
        Route::post('/admin/usuarios', [AdminController::class, 'createUsuario']);
        Route::put('/admin/usuarios/{id}', [AdminController::class, 'updateUsuario']);
        Route::post('/admin/usuarios/{id}/block', [AdminController::class, 'blockUsuario']);
        Route::post('/admin/usuarios/{id}/unblock', [AdminController::class, 'unblockUsuario']);
        Route::delete('/admin/usuarios/{id}', [AdminController::class, 'deleteUsuario']);
        Route::post('/admin/usuarios/{id}/reset-password', [AdminController::class, 'resetPassword']);

        // Recetas
        Route::get('/admin/recetas', [AdminController::class, 'getRecetas']);
        Route::put('/admin/recetas/{id}', [AdminController::class, 'updateReceta']);
        Route::post('/admin/recetas/{id}/block', [AdminController::class, 'blockReceta']);
        Route::post('/admin/recetas/{id}/unblock', [AdminController::class, 'unblockReceta']);
        Route::delete('/admin/recetas/{id}', [AdminController::class, 'deleteReceta']);

        // Reportes
        Route::get('/admin/reports', [AdminController::class, 'getReports']);
        Route::post('/admin/reports', [AdminController::class, 'createReport']);
        Route::put('/admin/reports/{id}', [AdminController::class, 'resolveReport']);

        // Logs
        Route::get('/admin/logs', [AdminController::class, 'getLogs']);

        // Parámetros del sistema
        Route::get('/admin/parameters', [AdminController::class, 'getParameters']);
        Route::post('/admin/parameters', [AdminController::class, 'createParameter']);
        Route::put('/admin/parameters/{id}', [AdminController::class, 'updateParameter']);

        // Backups
        Route::post('/admin/backup/create', [AdminController::class, 'createBackup']);
        Route::get('/admin/backup/list', [AdminController::class, 'listBackups']);

        // Estadísticas
        Route::get('/admin/statistics', [AdminController::class, 'getStatistics']);
    });
});

// Validación de imagen de comida usando Hugging Face
Route::post('/validate-food-image', function (Request $request) {
    $request->validate([
        'image' => 'required|string', // base64
    ]);

    $imageBase64 = $request->input('image');
    $imageData = base64_decode($imageBase64);

    // Llama a un modelo público de Hugging Face Spaces (ejemplo: food-classification)
    $response = Http::attach('file', $imageData, 'image.jpg')
        ->post('https://hf.space/embed/akhaliq/food-classification/+/api/predict');

    if ($response->failed()) {
        return response()->json(['success' => false, 'message' => 'Error al validar imagen'], 500);
    }

    $result = $response->json();
    // El modelo devuelve una lista de etiquetas, buscamos "food" o similar
    $labels = $result['data'][0]['label'] ?? '';
    $isFood = stripos($labels, 'food') !== false;

    return response()->json([
        'success' => $isFood,
        'label' => $labels,
        'raw' => $result,
    ]);
});

