<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Receta;
use Illuminate\Database\Seeder;

class RecetaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $usuario = User::first();
        if (!$usuario) {
            $usuario = User::factory()->create();
        }

        $recetas = [
            // Veganas
            [
                'titulo' => 'Ensalada Vegana Mediterránea',
                'descripcion' => 'Una deliciosa ensalada vegana con vegetales frescos y garbanzos',
                'tipo_dieta' => 'vegana',
                'imagen_url' => 'https://via.placeholder.com/300x300?text=Ensalada+Vegana',
                'tiempo_preparacion' => '15 min',
                'porciones' => 4,
                'dificultad' => 'Fácil',
                'ingredientes' => ['lechuga', 'tomate', 'pepino', 'garbanzos', 'aceitunas', 'aceite de oliva'],
            ],
            [
                'titulo' => 'Buddha Bowl Vegano',
                'descripcion' => 'Tazón saludable con granos, vegetales y tahini',
                'tipo_dieta' => 'vegana',
                'imagen_url' => 'https://via.placeholder.com/300x300?text=Buddha+Bowl',
                'tiempo_preparacion' => '20 min',
                'porciones' => 2,
                'dificultad' => 'Fácil',
                'ingredientes' => ['quinua', 'brocoli', 'camote', 'garbanzos', 'tahini', 'limón'],
            ],
            [
                'titulo' => 'Pasta Vegana Aglio e Olio',
                'descripcion' => 'Pasta clásica italiana sin productos de origen animal',
                'tipo_dieta' => 'vegana',
                'imagen_url' => 'https://via.placeholder.com/300x300?text=Pasta+Vegana',
                'tiempo_preparacion' => '25 min',
                'porciones' => 4,
                'dificultad' => 'Fácil',
                'ingredientes' => ['pasta', 'ajo', 'aceite de oliva', 'perejil', 'pimienta'],
            ],
            [
                'titulo' => 'Sopa de Lentejas Vegana',
                'descripcion' => 'Sopa nutritiva y reconfortante con lentejas rojas',
                'tipo_dieta' => 'vegana',
                'imagen_url' => 'https://via.placeholder.com/300x300?text=Sopa+Lentejas',
                'tiempo_preparacion' => '35 min',
                'porciones' => 6,
                'dificultad' => 'Fácil',
                'ingredientes' => ['lentejas rojas', 'cebolla', 'zanahoria', 'apio', 'caldo vegetal', 'tomate'],
            ],
            [
                'titulo' => 'Tacos Veganos de Soja',
                'descripcion' => 'Tacos deliciosos con proteína de soja texturizada',
                'tipo_dieta' => 'vegana',
                'imagen_url' => 'https://via.placeholder.com/300x300?text=Tacos+Veganos',
                'tiempo_preparacion' => '30 min',
                'porciones' => 4,
                'dificultad' => 'Media',
                'ingredientes' => ['soja texturizada', 'tortillas', 'lechuga', 'tomate', 'salsa', 'cebolla'],
            ],
            // Vegetarianas
            [
                'titulo' => 'Omelette de Vegetales',
                'descripcion' => 'Omelette esponjoso relleno de vegetales frescos',
                'tipo_dieta' => 'vegetariana',
                'imagen_url' => 'https://via.placeholder.com/300x300?text=Omelette',
                'tiempo_preparacion' => '20 min',
                'porciones' => 2,
                'dificultad' => 'Fácil',
                'ingredientes' => ['huevo', 'champiñones', 'tomate', 'cebolla', 'queso', 'mantequilla'],
            ],
            [
                'titulo' => 'Pizzas Vegetarianas Caseras',
                'descripcion' => 'Pizza hecha en casa con vegetales frescos y queso mozzarella',
                'tipo_dieta' => 'vegetariana',
                'imagen_url' => 'https://via.placeholder.com/300x300?text=Pizza',
                'tiempo_preparacion' => '40 min',
                'porciones' => 4,
                'dificultad' => 'Media',
                'ingredientes' => ['masa de pizza', 'tomate', 'queso mozzarella', 'champiñones', 'cebolla', 'orégano'],
            ],
            [
                'titulo' => 'Papas Rellenas de Queso',
                'descripcion' => 'Papas al horno rellenas de queso derretido',
                'tipo_dieta' => 'vegetariana',
                'imagen_url' => 'https://via.placeholder.com/300x300?text=Papas+Rellenas',
                'tiempo_preparacion' => '45 min',
                'porciones' => 4,
                'dificultad' => 'Media',
                'ingredientes' => ['papas', 'queso cheddar', 'crema agria', 'cebolla', 'mantequilla'],
            ],
            // Carnes (Gym)
            [
                'titulo' => 'Pechuga de Pollo a la Parrilla',
                'descripcion' => 'Proteína magra perfecta para ganar músculo',
                'tipo_dieta' => 'gym',
                'imagen_url' => 'https://via.placeholder.com/300x300?text=Pechuga+Pollo',
                'tiempo_preparacion' => '25 min',
                'porciones' => 2,
                'dificultad' => 'Fácil',
                'ingredientes' => ['pechuga de pollo', 'limón', 'ajo', 'aceite de oliva', 'sal', 'pimienta'],
            ],
            [
                'titulo' => 'Batido Proteico de Plátano',
                'descripcion' => 'Batido alto en proteína para post-entrenamiento',
                'tipo_dieta' => 'gym',
                'imagen_url' => 'https://via.placeholder.com/300x300?text=Batido+Proteico',
                'tiempo_preparacion' => '5 min',
                'porciones' => 1,
                'dificultad' => 'Fácil',
                'ingredientes' => ['proteína en polvo', 'plátano', 'leche', 'mantequilla de maní'],
            ],
            [
                'titulo' => 'Huevos Revueltos con Claras',
                'descripcion' => 'Desayuno proteico bajo en grasas',
                'tipo_dieta' => 'gym',
                'imagen_url' => 'https://via.placeholder.com/300x300?text=Huevos',
                'tiempo_preparacion' => '15 min',
                'porciones' => 1,
                'dificultad' => 'Fácil',
                'ingredientes' => ['claras de huevo', 'yema', 'cebolla', 'tomate', 'sal'],
            ],
            // Bajar de peso
            [
                'titulo' => 'Ensalada de Pollo Bajo en Calorías',
                'descripcion' => 'Ensalada saludable con pollo desmenuzado',
                'tipo_dieta' => 'bajar_peso',
                'imagen_url' => 'https://via.placeholder.com/300x300?text=Ensalada+Pollo',
                'tiempo_preparacion' => '20 min',
                'porciones' => 2,
                'dificultad' => 'Fácil',
                'ingredientes' => ['pechuga de pollo', 'lechuga', 'tomate', 'zanahoria', 'vinagre balsámico'],
            ],
            [
                'titulo' => 'Salmón Baked Light',
                'descripcion' => 'Salmón horneado sin aceite extra, bajo en calorías',
                'tipo_dieta' => 'bajar_peso',
                'imagen_url' => 'https://via.placeholder.com/300x300?text=Salmon',
                'tiempo_preparacion' => '30 min',
                'porciones' => 2,
                'dificultad' => 'Media',
                'ingredientes' => ['salmón', 'limón', 'espárragos', 'brócoli', 'sal'],
            ],
            [
                'titulo' => 'Sopa de Verduras Light',
                'descripcion' => 'Sopa baja en calorías con muchas verduras',
                'tipo_dieta' => 'bajar_peso',
                'imagen_url' => 'https://via.placeholder.com/300x300?text=Sopa+Verduras',
                'tiempo_preparacion' => '35 min',
                'porciones' => 4,
                'dificultad' => 'Fácil',
                'ingredientes' => ['zanahoria', 'apio', 'cebolla', 'coliflor', 'caldo bajo en sodio'],
            ],
        ];

        foreach ($recetas as $receta) {
            Receta::create(array_merge($receta, [
                'user_id' => $usuario->id,
                'pasos' => ['Paso 1', 'Paso 2', 'Paso 3'],
                'likes_count' => 0,
                'comentarios_count' => 0,
                'is_blocked' => false,
            ]));
        }
    }
}
