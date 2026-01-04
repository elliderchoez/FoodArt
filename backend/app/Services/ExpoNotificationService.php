<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExpoNotificationService
{
    private const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

    /**
     * Enviar notificación push a un usuario
     */
    public static function sendNotification($token, $title, $body, $data = [])
    {
        if (!$token) {
            Log::warning('📭 Token de notificación vacío - no se envió notificación');
            return false;
        }

        try {
            $payload = [
                'to' => $token,
                'sound' => 'default',
                'title' => $title,
                'body' => $body,
                'data' => $data,
                'badge' => 1,
            ];

            Log::info('📤 Enviando notificación Push a Expo...', [
                'token' => substr($token, 0, 20) . '...',
                'title' => $title,
            ]);

            $response = Http::timeout(10)->post(self::EXPO_PUSH_API, $payload);

            if ($response->successful()) {
                $result = $response->json();
                Log::info('✅ Notificación enviada exitosamente a Expo', [
                    'title' => $title,
                    'response_id' => $result['data']['id'] ?? 'unknown',
                ]);
                return true;
            } else {
                Log::error('❌ Error enviando notificación a Expo', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'title' => $title,
                ]);
                return false;
            }
        } catch (\Exception $e) {
            Log::error('❌ Excepción enviando notificación a Expo: ' . $e->getMessage(), [
                'title' => $title,
                'token' => substr($token, 0, 20) . '...',
            ]);
            return false;
        }
    }

    /**
     * Notificar que alguien dio like a una receta
     */
    public static function notifyLike($recetaAuthorToken, $userName, $recetaTitle, $recetaId)
    {
        return self::sendNotification(
            $recetaAuthorToken,
            '❤️ ' . $userName . ' dio like',
            'Le gustó tu receta: ' . $recetaTitle,
            [
                'type' => 'like',
                'recipeId' => $recetaId,
                'userName' => $userName,
            ]
        );
    }

    /**
     * Notificar que alguien comentó una receta
     */
    public static function notifyComment($recetaAuthorToken, $userName, $recetaTitle, $recetaId, $commentPreview)
    {
        return self::sendNotification(
            $recetaAuthorToken,
            '💬 ' . $userName . ' comentó',
            $commentPreview,
            [
                'type' => 'comment',
                'recipeId' => $recetaId,
                'userName' => $userName,
            ]
        );
    }

    /**
     * Notificar que alguien empezó a seguir al usuario
     */
    public static function notifyFollow($userToken, $followerName, $followerId)
    {
        return self::sendNotification(
            $userToken,
            '👥 ' . $followerName . ' empezó a seguirte',
            'Comparte tus recetas con ' . $followerName,
            [
                'type' => 'follow',
                'userId' => $followerId,
                'userName' => $followerName,
            ]
        );
    }

    /**
     * Notificar que se creó una nueva receta de un usuario que sigues
     */
    public static function notifyNewRecipe($followerToken, $authorName, $recetaTitle, $recetaId)
    {
        return self::sendNotification(
            $followerToken,
            '🍳 ' . $authorName . ' compartió una receta',
            $recetaTitle,
            [
                'type' => 'recipe',
                'recipeId' => $recetaId,
                'authorName' => $authorName,
            ]
        );
    }
}
