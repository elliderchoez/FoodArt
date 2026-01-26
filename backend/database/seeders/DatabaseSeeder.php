<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Usuario de prueba
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Usuario Prueba',
                'email' => 'test@example.com',
                'password' => Hash::make('password123'),
                'descripcion' => 'Este es un usuario de prueba para la aplicación Food Art',
                'imagen_perfil' => 'https://via.placeholder.com/150?text=Test+User',
                'email_verified_at' => now(),
            ]
        );

        // Usuario administrador (role=admin)
        $this->call([
            AdminSeeder::class,
        ]);
    }
}
