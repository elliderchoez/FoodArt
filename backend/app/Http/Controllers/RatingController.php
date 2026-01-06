<?php

namespace App\Http\Controllers;

use App\Models\Rating;
use App\Models\Receta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RatingController extends Controller
{
    /**
     * Mostrar promedio y conteo de una receta y, si está autenticado, el rating del usuario.
     */
    public function show(Request $request, $recetaId)
    {
        $receta = Receta::findOrFail($recetaId);

        $average = $receta->ratingAverage();
        $count = $receta->ratingCount();

        $userRating = null;
        if ($request->user()) {
            $rating = Rating::where('receta_id', $recetaId)
                ->where('user_id', $request->user()->id)
                ->first();
            $userRating = $rating ? $rating->rating : null;
        }

        return response()->json([
            'average' => $average !== null ? round((float)$average, 2) : null,
            'count' => (int)$count,
            'user_rating' => $userRating,
        ]);
    }

    /**
     * Guardar o actualizar rating de usuario para una receta.
     */
    public function store(Request $request, $recetaId)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
        ]);

        $receta = Receta::findOrFail($recetaId);

        $ratingValue = (int) $request->input('rating');

        $rating = Rating::updateOrCreate(
            ['user_id' => $user->id, 'receta_id' => $receta->id],
            ['rating' => $ratingValue]
        );

        // Recalcular
        $average = $receta->ratingAverage();
        $count = $receta->ratingCount();

        return response()->json([
            'message' => 'Rating saved',
            'average' => $average !== null ? round((float)$average, 2) : null,
            'count' => (int)$count,
            'user_rating' => $rating->rating,
        ]);
    }
}
