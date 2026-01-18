<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear usuario admin
        $adminExists = User::where('email', 'admin@gmail.com')->first();

        if (!$adminExists) {
            User::create([
                'name' => 'Administrador',
                'email' => 'admin@gmail.com',
                'password' => Hash::make('Admin123'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]);

            $this->command->info('Usuario admin creado: admin@gmail.com / Admin123');
        } else {
            $this->command->info('El usuario admin ya existe');
        }
    }
}
