<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Receta;
use App\Models\SystemLog;
use App\Models\ReportReceta;
use App\Models\ReportUsuario;
use App\Models\Notification;
use App\Models\SystemParameter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Services\ExpoNotificationService;

class AdminController extends Controller
{
    // ========== USUARIOS ==========

    /**
     * Obtener lista de todos los usuarios
     */
    public function getUsuarios(Request $request)
    {
        $query = User::query();

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
        }

        if ($request->has('role')) {
            $query->where('role', $request->input('role'));
        }

        if ($request->has('blocked')) {
            $query->where('is_blocked', $request->boolean('blocked'));
        }

        $usuarios = $query->paginate(15);

        return response()->json([
            'message' => 'Usuarios obtenidos',
            'data' => $usuarios
        ]);
    }

    /**
     * Crear nuevo usuario manualmente
     */
    public function createUsuario(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'sometimes|in:usuario,admin',
        ]);

        $usuario = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? 'usuario',
        ]);

        $this->logAction(Auth::id(), 'crear_usuario', 'User', $usuario->id, "Nuevo usuario: {$usuario->email}");

        return response()->json([
            'message' => 'Usuario creado exitosamente',
            'data' => $usuario
        ], 201);
    }

    /**
     * Editar usuario
     */
    public function updateUsuario(Request $request, $userId)
    {
        $usuario = User::findOrFail($userId);

        // Seguridad: evitar que un admin modifique cuentas admin de terceros.
        if ($usuario->role === 'admin' && Auth::id() !== $usuario->getKey()) {
            return response()->json([
                'message' => 'No autorizado para modificar esta cuenta.'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $userId,
            'descripcion' => 'sometimes|string',
        ]);

        $changes = [];
        foreach ($validated as $key => $value) {
            if ($usuario->{$key} != $value) {
                $changes[$key] = ['old' => $usuario->{$key}, 'new' => $value];
            }
        }

        $usuario->update($validated);

        $this->logAction(Auth::id(), 'editar_usuario', 'User', $usuario->id, "Editar usuario: {$usuario->email}", $changes);

        return response()->json([
            'message' => 'Usuario actualizado',
            'data' => $usuario
        ]);
    }

    /**
     * Bloquear usuario
     */
    public function blockUsuario(Request $request, $userId)
    {
        $usuario = User::findOrFail($userId);

        // Seguridad: evitar que un admin bloquee cuentas admin de terceros.
        if ($usuario->role === 'admin' && Auth::id() !== $usuario->getKey()) {
            return response()->json([
                'message' => 'No autorizado para bloquear esta cuenta.'
            ], 403);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $usuario->update([
            'is_blocked' => true,
            'blocked_at' => now(),
            'block_reason' => $validated['reason'],
        ]);

        $this->logAction(Auth::id(), 'bloquear_usuario', 'User', $usuario->id, "Bloqueado por: {$validated['reason']}");

        return response()->json([
            'message' => 'Usuario bloqueado',
            'data' => $usuario
        ]);
    }

    /**
     * Desbloquear usuario
     */
    public function unblockUsuario($userId)
    {
        $usuario = User::findOrFail($userId);

        // Seguridad: evitar que un admin desbloquee cuentas admin de terceros.
        if ($usuario->role === 'admin' && Auth::id() !== $usuario->getKey()) {
            return response()->json([
                'message' => 'No autorizado para desbloquear esta cuenta.'
            ], 403);
        }

        $usuario->update([
            'is_blocked' => false,
            'blocked_at' => null,
            'block_reason' => null,
        ]);

        $this->logAction(Auth::id(), 'desbloquear_usuario', 'User', $usuario->id, "Usuario desbloqueado");

        return response()->json([
            'message' => 'Usuario desbloqueado',
            'data' => $usuario
        ]);
    }

    /**
     * Eliminar usuario
     */
    public function deleteUsuario($userId)
    {
        $usuario = User::findOrFail($userId);

        // Seguridad: evitar que un admin elimine cuentas admin de terceros.
        if ($usuario->role === 'admin' && Auth::id() !== $usuario->getKey()) {
            return response()->json([
                'message' => 'No autorizado para eliminar esta cuenta.'
            ], 403);
        }

        // Evitar auto-eliminación accidental.
        if (Auth::id() === $usuario->getKey()) {
            return response()->json([
                'message' => 'No puedes eliminar tu propia cuenta.'
            ], 422);
        }

        $email = $usuario->email;

        $this->logAction(Auth::id(), 'eliminar_usuario', 'User', $usuario->id, "Usuario eliminado: {$email}");

        $usuario->delete();

        return response()->json([
            'message' => 'Usuario eliminado exitosamente'
        ]);
    }

    /**
     * Resetear contraseña de usuario
     */
    public function resetPassword(Request $request, $userId)
    {
        $usuario = User::findOrFail($userId);

        // Seguridad: evitar que un admin resetee la contraseña de cuentas admin de terceros.
        if ($usuario->role === 'admin' && Auth::id() !== $usuario->getKey()) {
            return response()->json([
                'message' => 'No autorizado para resetear la contraseña de esta cuenta.'
            ], 403);
        }

        $validated = $request->validate([
            'password' => 'required|string|min:8',
        ]);

        $usuario->update([
            'password' => Hash::make($validated['password']),
        ]);

        $this->logAction(Auth::id(), 'resetear_password', 'User', $usuario->id, "Contraseña reseteada");

        return response()->json([
            'message' => 'Contraseña reseteada exitosamente'
        ]);
    }

    // ========== RECETAS ==========

    /**
     * Obtener todas las recetas con filtros
     */
    public function getRecetas(Request $request)
    {
        $query = Receta::with('user');

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('titulo', 'like', "%{$search}%")
                  ->orWhere('descripcion', 'like', "%{$search}%");
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        if ($request->has('blocked')) {
            $blocked = $request->input('blocked');
            if ($blocked == 1) {
                $query->where('is_blocked', true);
            } elseif ($blocked == 0) {
                $query->where('is_blocked', false);
            }
        }

        $recetas = $query->paginate(15);

        return response()->json([
            'message' => 'Recetas obtenidas',
            'data' => $recetas
        ]);
    }

    /**
     * Eliminar receta
     */
    public function deleteReceta($recetaId)
    {
        $receta = Receta::findOrFail($recetaId);
        $titulo = $receta->titulo;

        $this->logAction(Auth::id(), 'eliminar_receta', 'Receta', $receta->id, "Receta eliminada: {$titulo}");

        $receta->delete();

        return response()->json([
            'message' => 'Receta eliminada exitosamente'
        ]);
    }

    /**
     * Actualizar receta (aprobar cambios, etc)
     */
    public function updateReceta(Request $request, $recetaId)
    {
        $receta = Receta::findOrFail($recetaId);

        $validated = $request->validate([
            'titulo' => 'sometimes|string|max:255',
            'descripcion' => 'sometimes|string',
            'tiempo_preparacion' => 'sometimes|nullable|string|max:50',
            'porciones' => 'sometimes|nullable|integer|min:1',
            'dificultad' => 'sometimes|in:fácil,medio,difícil',
            'categoria' => 'sometimes|nullable|string|max:100',
            'ingredientes' => 'sometimes|json',
            'pasos' => 'sometimes|json',
        ]);

        $changes = [];
        foreach ($validated as $key => $value) {
            if ($receta->{$key} != $value) {
                $changes[$key] = ['old' => $receta->{$key}, 'new' => $value];
            }
        }

        $receta->update($validated);

        $this->logAction(Auth::id(), 'editar_receta', 'Receta', $receta->id, "Receta actualizada: {$receta->titulo}", $changes);

        return response()->json([
            'message' => 'Receta actualizada',
            'data' => $receta
        ]);
    }

    /**
     * Bloquear receta
     */
    public function blockReceta(Request $request, $recetaId)
    {
        $receta = Receta::findOrFail($recetaId);

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $receta->update([
            'is_blocked' => true,
            'block_reason' => $validated['reason'],
        ]);

        $this->logAction(Auth::id(), 'bloquear_receta', 'Receta', $receta->id, "Receta bloqueada: {$receta->titulo}", ['reason' => $validated['reason']]);

        return response()->json([
            'message' => 'Receta bloqueada',
            'data' => $receta
        ]);
    }

    /**
     * Desbloquear receta
     */
    public function unblockReceta($recetaId)
    {
        $receta = Receta::findOrFail($recetaId);

        $receta->update([
            'is_blocked' => false,
            'block_reason' => null,
        ]);

        $this->logAction(Auth::id(), 'desbloquear_receta', 'Receta', $receta->id, "Receta desbloqueada: {$receta->titulo}", []);

        return response()->json([
            'message' => 'Receta desbloqueada',
            'data' => $receta
        ]);
    }

    // ========== REPORTES ==========

    /**
     * Obtener reportes de recetas
     */
    public function getReports(Request $request)
    {
        $query = ReportReceta::with(['receta', 'usuario', 'reviewedBy']);

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $reports = $query->orderBy('created_at', 'desc')->paginate(15);
        $reports->getCollection()->transform(function ($report) {
            $report->type = 'receta';
            return $report;
        });

        return response()->json([
            'message' => 'Reportes obtenidos',
            'data' => $reports
        ]);
    }

    /**
     * Resolver reporte
     */
    public function resolveReport(Request $request, $reportId)
    {
        $report = ReportReceta::with(['receta.user', 'usuario'])->findOrFail($reportId);

        $validated = $request->validate([
            'status' => 'required|in:revisado,rechazado,resuelto',
            'response' => 'required|string|max:1000',
            // Compat: block_user (legacy) => bloquear autor de la receta
            'action' => 'sometimes|in:delete_receta,block_recipe,block_recipe_author,warn_recipe_author,block_user,none',
        ]);

        // Validaciones de acciones antes de escribir cambios.
        $action = $validated['action'] ?? 'none';
        $receta = $report->receta;
        $autor = optional($receta)->user;

        if (in_array($action, ['block_recipe', 'delete_receta'], true) && !$receta) {
            return response()->json([
                'message' => 'La receta asociada no existe.'
            ], 422);
        }

        if (in_array($action, ['block_recipe_author', 'block_user', 'warn_recipe_author'], true) && !$autor) {
            return response()->json([
                'message' => 'No se pudo determinar el autor de la receta.'
            ], 422);
        }

        if (in_array($action, ['block_recipe_author', 'block_user', 'warn_recipe_author'], true) && $autor) {
            if ($autor->role === 'admin' && Auth::id() !== $autor->getKey()) {
                return response()->json([
                    'message' => 'No autorizado para moderar esta cuenta.'
                ], 403);
            }
        }

        $report->update([
            'status' => $validated['status'],
            'admin_response' => $validated['response'],
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);

        // Ejecutar acción si es necesaria
        if ($action !== 'none') {

            if ($action === 'delete_receta') {
                $recetaId = $report->receta_id;
                $recetaTitulo = optional($report->receta)->titulo;
                optional($report->receta)->delete();
                $this->logAction(Auth::id(), 'eliminar_receta_reporte', 'Receta', $recetaId, 'Receta eliminada por reporte', [
                    'titulo' => $recetaTitulo,
                ]);
            } elseif ($action === 'block_recipe') {
                if ($report->receta) {
                    $report->receta->update([
                        'is_blocked' => true,
                        'block_reason' => 'Bloqueada por reporte (moderación)',
                    ]);
                    $this->logAction(Auth::id(), 'bloquear_receta_reporte', 'Receta', $report->receta_id, 'Receta bloqueada por reporte');
                }
            } elseif ($action === 'warn_recipe_author') {
                if ($autor) {
                    $this->notifyUser(
                        $autor,
                        'warning',
                        '⚠️ Advertencia de moderación',
                        'Tu receta fue reportada y un administrador emitió una advertencia. Revisa las políticas de la comunidad.',
                        $report->receta_id,
                        Auth::id(),
                        [
                            'reason' => $report->reason,
                            'reportId' => $report->id,
                        ]
                    );
                    $this->logAction(Auth::id(), 'advertencia_autor_receta', 'User', $autor->getKey(), 'Advertencia enviada por reporte');
                }
            } elseif ($action === 'block_recipe_author' || $action === 'block_user') {
                // IMPORTANTE: usuario del reporte = reportante. Aquí queremos moderar al autor de la receta.
                if ($autor) {
                    $autor->update([
                        'is_blocked' => true,
                        'blocked_at' => now(),
                        'block_reason' => 'Bloqueado por reporte (moderación)',
                    ]);
                    $this->logAction(Auth::id(), 'bloquear_autor_receta_reporte', 'User', $autor->getKey(), 'Autor bloqueado por reporte');
                }
            }
        }

        // Notificar al usuario que reportó
        if ($report->usuario) {
            $tituloReceta = $receta ? ($receta->titulo ?? 'una receta') : 'una receta';
            $status = $validated['status'];
            $statusLabel = $status === 'resuelto' ? 'resuelto' : ($status === 'rechazado' ? 'rechazado' : 'revisado');

            $this->notifyUser(
                $report->usuario,
                'report_reviewed',
                '📣 Tu reporte fue revisado',
                'Tu reporte sobre "' . $tituloReceta . '" fue ' . $statusLabel . '. Respuesta: ' . $validated['response'],
                $report->receta_id,
                Auth::id(),
                [
                    'status' => $status,
                    'reportId' => $report->id,
                ]
            );
        }

        $this->logAction(Auth::id(), 'resolver_reporte', 'Report', $report->id, "Reporte resuelto: {$validated['status']}");

        return response()->json([
            'message' => 'Reporte resuelto',
            'data' => $report
        ]);
    }

    /**
     * Obtener reportes de usuarios
     */
    public function getUserReports(Request $request)
    {
        $query = ReportUsuario::with(['reportedUser', 'reporter', 'reviewedBy']);

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $reports = $query->orderBy('created_at', 'desc')->paginate(15);
        $reports->getCollection()->transform(function ($report) {
            $report->type = 'usuario';
            return $report;
        });

        return response()->json([
            'message' => 'Reportes de usuario obtenidos',
            'data' => $reports
        ]);
    }

    /**
     * Resolver reporte de usuario
     */
    public function resolveUserReport(Request $request, $reportId)
    {
        $report = ReportUsuario::with(['reportedUser', 'reporter'])->findOrFail($reportId);

        $validated = $request->validate([
            'status' => 'required|in:revisado,rechazado,resuelto',
            'response' => 'required|string|max:1000',
            'action' => 'sometimes|in:block_reported_user,warn_reported_user,none',
        ]);

        $action = $validated['action'] ?? 'none';

        if (in_array($action, ['block_reported_user', 'warn_reported_user'], true)) {
            $user = $report->reportedUser;
            if (!$user) {
                return response()->json([
                    'message' => 'El usuario reportado no existe.'
                ], 422);
            }

            if ($user->role === 'admin' && Auth::id() !== $user->getKey()) {
                return response()->json([
                    'message' => 'No autorizado para moderar esta cuenta.'
                ], 403);
            }
        }

        $report->update([
            'status' => $validated['status'],
            'admin_response' => $validated['response'],
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);

        if ($action === 'warn_reported_user') {
            $user = $report->reportedUser;
            if ($user) {
                $this->notifyUser(
                    $user,
                    'warning',
                    '⚠️ Advertencia de moderación',
                    'Tu cuenta fue reportada y un administrador emitió una advertencia. Revisa las políticas de la comunidad.',
                    null,
                    Auth::id(),
                    [
                        'reason' => $report->reason,
                        'reportId' => $report->id,
                    ]
                );
                $this->logAction(Auth::id(), 'advertencia_usuario_reportado', 'User', $user->getKey(), 'Advertencia enviada por reporte de usuario');
            }
        } elseif ($action === 'block_reported_user') {
            $user = $report->reportedUser;
            if ($user) {
                $user->update([
                    'is_blocked' => true,
                    'blocked_at' => now(),
                    'block_reason' => 'Bloqueado por reporte (moderación)',
                ]);

                $this->logAction(Auth::id(), 'bloquear_usuario_reportado', 'User', $user->getKey(), 'Usuario reportado bloqueado');
            }
        }

        // Notificar al usuario que reportó
        if ($report->reporter) {
            $reportedName = $report->reportedUser->name ?? 'un usuario';
            $status = $validated['status'];
            $statusLabel = $status === 'resuelto' ? 'resuelto' : ($status === 'rechazado' ? 'rechazado' : 'revisado');

            $this->notifyUser(
                $report->reporter,
                'report_reviewed',
                '📣 Tu reporte fue revisado',
                'Tu reporte sobre "' . $reportedName . '" fue ' . $statusLabel . '. Respuesta: ' . $validated['response'],
                null,
                Auth::id(),
                [
                    'status' => $status,
                    'reportId' => $report->id,
                ]
            );
        }

        $this->logAction(Auth::id(), 'resolver_reporte_usuario', 'ReportUsuario', $report->id, 'Reporte de usuario resuelto', [
            'status' => $validated['status'],
            'action' => $validated['action'] ?? 'none',
        ]);

        return response()->json([
            'message' => 'Reporte de usuario resuelto',
            'data' => $report
        ]);
    }

    /**
     * Crear reporte manual
     */
    public function createReport(Request $request)
    {
        $validated = $request->validate([
            'receta_id' => 'required|exists:recetas,id',
            'usuario_id' => 'required|exists:users,id',
            'reason' => 'required|in:inapropiado,spam,falso,plagios,otro',
            'description' => 'required|string|max:1000',
        ]);

        $report = ReportReceta::create($validated);

        $this->logAction(Auth::id(), 'crear_reporte', 'Report', $report->id, "Nuevo reporte creado");

        return response()->json([
            'message' => 'Reporte creado',
            'data' => $report
        ], 201);
    }

    // ========== LOGS ==========

    /**
     * Obtener logs del sistema
     */
    public function getLogs(Request $request)
    {
        $query = SystemLog::with('admin');

        if ($request->has('action')) {
            $query->where('action', $request->input('action'));
        }

        if ($request->has('entity_type')) {
            $query->where('entity_type', $request->input('entity_type'));
        }

        if ($request->has('admin_id')) {
            $query->where('admin_id', $request->input('admin_id'));
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(50);

        return response()->json([
            'message' => 'Logs obtenidos',
            'data' => $logs
        ]);
    }

    // ========== PARÁMETROS ==========

    /**
     * Obtener todos los parámetros del sistema
     */
    public function getParameters()
    {
        $parameters = SystemParameter::all();

        return response()->json([
            'message' => 'Parámetros obtenidos',
            'data' => $parameters
        ]);
    }

    /**
     * Actualizar parámetro del sistema
     */
    public function updateParameter(Request $request, $paramId)
    {
        $parameter = SystemParameter::findOrFail($paramId);

        $validated = $request->validate([
            'value' => 'required|string',
            'description' => 'sometimes|string',
        ]);

        $oldValue = $parameter->value;

        $parameter->update([
            'value' => $validated['value'],
            'description' => $validated['description'] ?? $parameter->description,
            'updated_by' => Auth::id(),
        ]);

        $this->logAction(Auth::id(), 'actualizar_parametro', 'SystemParameter', $parameter->id,
            "Parámetro {$parameter->key} actualizado",
            ['key' => $parameter->key, 'old' => $oldValue, 'new' => $validated['value']]
        );

        return response()->json([
            'message' => 'Parámetro actualizado',
            'data' => $parameter
        ]);
    }

    /**
     * Crear parámetro
     */
    public function createParameter(Request $request)
    {
        $validated = $request->validate([
            'key' => 'required|string|unique:system_parameters',
            'value' => 'required|string',
            'description' => 'sometimes|string',
            'type' => 'sometimes|in:string,integer,boolean,json',
        ]);

        $parameter = SystemParameter::create([
            'key' => $validated['key'],
            'value' => $validated['value'],
            'description' => $validated['description'] ?? null,
            'type' => $validated['type'] ?? 'string',
            'updated_by' => Auth::id(),
        ]);

        $this->logAction(Auth::id(), 'crear_parametro', 'SystemParameter', $parameter->id, "Nuevo parámetro: {$parameter->key}");

        return response()->json([
            'message' => 'Parámetro creado',
            'data' => $parameter
        ], 201);
    }

    // ========== BACKUPS ==========

    /**
     * Crear backup de la base de datos
     */
    public function createBackup()
    {
        try {
            $filename = 'backup_' . date('Y-m-d_H-i-s') . '.sql';
            $backupPath = storage_path('app/backups/' . $filename);

            // Crear directorio si no existe
            if (!file_exists(dirname($backupPath))) {
                mkdir(dirname($backupPath), 0755, true);
            }

            $command = sprintf(
                'mysqldump -h%s -u%s -p%s %s > %s',
                escapeshellarg(env('DB_HOST')),
                escapeshellarg(env('DB_USERNAME')),
                escapeshellarg(env('DB_PASSWORD')),
                escapeshellarg(env('DB_DATABASE')),
                escapeshellarg($backupPath)
            );

            exec($command, $output, $exitCode);

            if ($exitCode === 0) {
                $this->logAction(Auth::id(), 'crear_backup', 'Database', null, "Backup creado: {$filename}");

                return response()->json([
                    'message' => 'Backup creado exitosamente',
                    'filename' => $filename
                ], 201);
            } else {
                return response()->json([
                    'message' => 'Error al crear backup',
                    'error' => 'database_error'
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear backup',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listar backups disponibles
     */
    public function listBackups()
    {
        $backupPath = storage_path('app/backups/');

        if (!file_exists($backupPath)) {
            return response()->json([
                'message' => 'No hay backups',
                'data' => []
            ]);
        }

        $files = array_diff(scandir($backupPath), ['.', '..']);
        $backups = [];

        foreach ($files as $file) {
            $filePath = $backupPath . $file;
            $backups[] = [
                'filename' => $file,
                'size' => filesize($filePath),
                'created' => filemtime($filePath),
            ];
        }

        return response()->json([
            'message' => 'Backups obtenidos',
            'data' => $backups
        ]);
    }

    // ========== ESTADÍSTICAS ==========

    /**
     * Obtener estadísticas del sistema
     */
    public function getStatistics()
    {
        $stats = [
            'total_usuarios' => User::count(),
            'usuarios_bloqueados' => User::where('is_blocked', true)->count(),
            'total_recetas' => Receta::count(),
            'total_reportes' => ReportReceta::count(),
            'reportes_pendientes' => ReportReceta::where('status', 'pendiente')->count(),
            'usuarios_activos_hoy' => User::whereDate('updated_at', today())->count(),
            'recetas_creadas_hoy' => Receta::whereDate('created_at', today())->count(),
        ];

        return response()->json([
            'message' => 'Estadísticas obtenidas',
            'data' => $stats
        ]);
    }

    // ========== HELPER ==========

    /**
     * Registrar acción en logs
     */
    private function logAction($adminId, $action, $entityType, $entityId = null, $description = null, $changes = null)
    {
        SystemLog::create([
            'admin_id' => $adminId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'description' => $description,
            'changes' => $changes,
            'ip_address' => request()->ip(),
        ]);
    }

    private function notifyUser(User $toUser, string $type, string $title, string $body, ?int $recipeId = null, ?int $fromUserId = null, array $data = [])
    {
        $notification = Notification::create([
            'user_id' => $toUser->getKey(),
            'from_user_id' => $fromUserId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'recipe_id' => $recipeId,
            'read' => false,
        ]);

        $payload = array_merge([
            'type' => $type,
            'recipeId' => $recipeId,
            'userId' => $fromUserId,
            'notificationId' => $notification->id,
        ], $data);

        ExpoNotificationService::sendNotification(
            $toUser->expo_push_token ?? null,
            $title,
            $body,
            $payload
        );
    }
}
