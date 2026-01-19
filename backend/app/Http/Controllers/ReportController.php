<?php

namespace App\Http\Controllers;

use App\Models\Receta;
use App\Models\Comentario;
use App\Models\ReportReceta;
use App\Models\ReportUsuario;
use App\Models\ReportComentario;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReportController extends Controller
{
    public function reportReceta(Request $request, $recetaId)
    {
        $receta = Receta::findOrFail($recetaId);

        $authUserId = Auth::id();
        if (!$authUserId) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        // Evitar auto-reporte
        if ($authUserId === $receta->user_id) {
            return response()->json([
                'message' => 'No puedes reportar tu propia receta.'
            ], 422);
        }

        $validated = $request->validate([
            'reason' => 'required|in:inapropiado,spam,falso,plagios,otro',
            'description' => 'nullable|string|max:1000',
        ]);

        if (($validated['reason'] ?? null) === 'otro' && strlen(trim((string) ($validated['description'] ?? ''))) < 5) {
            return response()->json([
                'message' => 'Describe el motivo (mínimo 5 caracteres) cuando seleccionas "otro".'
            ], 422);
        }

        // Evitar spam: un reporte pendiente por usuario/receta
        $alreadyPending = ReportReceta::where('receta_id', $receta->id)
            ->where('usuario_id', $authUserId)
            ->where('status', 'pendiente')
            ->exists();

        if ($alreadyPending) {
            return response()->json([
                'message' => 'Ya has reportado esta receta. Nuestro equipo lo revisará.'
            ], 409);
        }

        $report = ReportReceta::create([
            'receta_id' => $receta->id,
            // Nota: en este proyecto, `usuario_id` se usa como el usuario reportador.
            'usuario_id' => $authUserId,
            'reason' => $validated['reason'],
            'description' => $validated['description'] ?? null,
            'status' => 'pendiente',
        ]);

        return response()->json([
            'message' => 'Reporte enviado',
            'data' => $report,
        ], 201);
    }

    public function reportUsuario(Request $request, $userId)
    {
        $reported = User::findOrFail($userId);

        $authUserId = Auth::id();
        if (!$authUserId) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        if ($authUserId === $reported->id) {
            return response()->json([
                'message' => 'No puedes reportar tu propio perfil.'
            ], 422);
        }

        $validated = $request->validate([
            'reason' => 'required|in:inapropiado,spam,acoso,suplantacion,otro',
            'description' => 'nullable|string|max:1000',
        ]);

        if (($validated['reason'] ?? null) === 'otro' && strlen(trim((string) ($validated['description'] ?? ''))) < 5) {
            return response()->json([
                'message' => 'Describe el motivo (mínimo 5 caracteres) cuando seleccionas "otro".'
            ], 422);
        }

        $alreadyPending = ReportUsuario::where('reported_user_id', $reported->id)
            ->where('reporter_id', $authUserId)
            ->where('status', 'pendiente')
            ->exists();

        if ($alreadyPending) {
            return response()->json([
                'message' => 'Ya has reportado a este usuario. Nuestro equipo lo revisará.'
            ], 409);
        }

        $report = ReportUsuario::create([
            'reported_user_id' => $reported->id,
            'reporter_id' => $authUserId,
            'reason' => $validated['reason'],
            'description' => $validated['description'] ?? null,
            'status' => 'pendiente',
        ]);

        return response()->json([
            'message' => 'Reporte enviado',
            'data' => $report,
        ], 201);
    }

    public function reportComentario(Request $request, $comentarioId)
    {
        $comentario = Comentario::with(['user', 'receta'])->findOrFail($comentarioId);

        $authUserId = Auth::id();
        if (!$authUserId) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        // Evitar auto-reporte
        if ($authUserId === $comentario->user_id) {
            return response()->json([
                'message' => 'No puedes reportar tu propio comentario.'
            ], 422);
        }

        $validated = $request->validate([
            'reason' => 'required|in:inapropiado,spam,acoso,otro',
            'description' => 'nullable|string|max:1000',
        ]);

        if (($validated['reason'] ?? null) === 'otro' && strlen(trim((string) ($validated['description'] ?? ''))) < 5) {
            return response()->json([
                'message' => 'Describe el motivo (mínimo 5 caracteres) cuando seleccionas "otro".'
            ], 422);
        }

        // Evitar spam: un reporte pendiente por usuario/comentario
        $alreadyPending = ReportComentario::where('comentario_id', $comentario->id)
            ->where('reporter_id', $authUserId)
            ->where('status', 'pendiente')
            ->exists();

        if ($alreadyPending) {
            return response()->json([
                'message' => 'Ya has reportado este comentario. Nuestro equipo lo revisará.'
            ], 409);
        }

        $report = ReportComentario::create([
            'comentario_id' => $comentario->id,
            'receta_id' => $comentario->receta_id,
            'reported_user_id' => $comentario->user_id,
            'reporter_id' => $authUserId,
            'reason' => $validated['reason'],
            'description' => $validated['description'] ?? null,
            'status' => 'pendiente',
        ]);

        return response()->json([
            'message' => 'Reporte enviado',
            'data' => $report,
        ], 201);
    }
}
