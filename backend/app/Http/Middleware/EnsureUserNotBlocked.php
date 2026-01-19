<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserNotBlocked
{
    /**
     * Block most authenticated actions for blocked users.
     * Allows a small set of endpoints so the client can show the wall and logout.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ($user->is_blocked ?? false)) {
            $path = $request->path();

            // Allow reading basic user info, notifications, and logging out.
            $allowed = [
                'api/user',
                'api/logout',
                'api/notifications',
                'api/notifications/*',
            ];

            if (!Str::is($allowed, $path)) {
                return response()->json([
                    'message' => 'Tu cuenta ha sido bloqueada',
                    'reason' => $user->block_reason,
                    'code' => 'ACCOUNT_BLOCKED',
                ], 403);
            }
        }

        return $next($request);
    }
}
