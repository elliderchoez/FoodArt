<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CorsMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $allowedOrigins = [
            'http://192.168.18.243:8081',
            'http://localhost:8081',
            'http://127.0.0.1:8081',
            'exp://192.168.18.243:19000',
            'exp://localhost:19000',
        ];

        $origin = $request->header('Origin');
        $allowOrigin = in_array($origin, $allowedOrigins) ? $origin : 'http://192.168.18.243:8081';

        // Para peticiones OPTIONS (preflight)
        if ($request->getMethod() === 'OPTIONS') {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', $allowOrigin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->header('Access-Control-Allow-Credentials', 'true');
        }

        $response = $next($request);

        // Headers para todas las respuestas
        $response->header('Access-Control-Allow-Origin', $allowOrigin);
        $response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        $response->header('Access-Control-Allow-Credentials', 'true');

        // Headers específicos para archivos estáticos
        if (strpos($request->path(), 'storage') !== false) {
            $response->header('Cache-Control', 'public, max-age=3600');
        }

        return $response;
    }
}
