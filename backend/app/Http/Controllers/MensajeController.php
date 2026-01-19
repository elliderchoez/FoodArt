<?php

namespace App\Http\Controllers;

use App\Models\Mensaje;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MensajeController extends Controller
{
    // Obtener conversaciones del usuario autenticado
    public function conversaciones()
    {
        $user = Auth::user();

        // Obtener conversaciones únicas (último mensaje con cada usuario)
        $conversaciones = Mensaje::where('remitente_id', $user->id)
            ->orWhere('destinatario_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy(function($mensaje) use ($user) {
                return $mensaje->remitente_id === $user->id
                    ? $mensaje->destinatario_id
                    : $mensaje->remitente_id;
            })
            ->map(function($grupo, $usuarioId) use ($user) {
                $ultimo = $grupo->first();
                $usuarioOtro = User::find($usuarioId);
                $noLeidos = $grupo->where('destinatario_id', $user->id)
                    ->where('leido', false)
                    ->count();

                return [
                    'usuario' => $usuarioOtro,
                    'ultimo_mensaje' => $ultimo->contenido,
                    'ultimo_mensaje_fecha' => $ultimo->created_at,
                    'no_leidos' => $noLeidos,
                ];
            })
            ->values();

        return response()->json([
            'data' => $conversaciones,
        ]);
    }

    // Obtener mensajes con un usuario específico
    public function obtenerMensajes($usuarioId)
    {
        $user = Auth::user();
        $usuarioOtro = User::find($usuarioId);

        if (!$usuarioOtro) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $mensajes = Mensaje::where(function($query) use ($user, $usuarioId) {
                $query->where('remitente_id', $user->id)
                    ->where('destinatario_id', $usuarioId);
            })
            ->orWhere(function($query) use ($user, $usuarioId) {
                $query->where('remitente_id', $usuarioId)
                    ->where('destinatario_id', $user->id);
            })
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'mensajes' => $mensajes,
            'usuario' => $usuarioOtro,
        ]);
    }

    // Enviar mensaje
    public function enviarMensaje(Request $request, $usuarioId)
    {
        $request->validate([
            'contenido' => 'required|string|max:500',
        ]);

        $user = Auth::user();
        $usuarioOtro = User::find($usuarioId);

        if (!$usuarioOtro) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $mensaje = Mensaje::create([
            'remitente_id' => $user->id,
            'destinatario_id' => $usuarioId,
            'contenido' => $request->contenido,
            'leido' => false,
        ]);

        return response()->json([
            'mensaje' => 'Mensaje enviado correctamente',
            'data' => $mensaje,
        ], 201);
    }

    // Marcar mensajes como leídos
    public function marcarLeidos($usuarioId)
    {
        $user = Auth::user();

        Mensaje::where('remitente_id', $usuarioId)
            ->where('destinatario_id', $user->id)
            ->where('leido', false)
            ->update([
                'leido' => true,
                'leido_at' => now(),
            ]);

        return response()->json([
            'mensaje' => 'Mensajes marcados como leídos',
        ]);
    }
}
