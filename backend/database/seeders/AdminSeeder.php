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
        $email = 'admin@foodart.com';
        $password = 'Admin12345';

        $admin = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Administrador',
                'password' => Hash::make($password),
                'role' => 'admin',
                'is_blocked' => false,
                'blocked_at' => null,
                'block_reason' => null,
                'email_verified_at' => now(),
            ]
        );

        $this->command->info(
            sprintf('Usuario admin listo: %s / %s (id=%s)', $email, $password, $admin->id)
        );
    }
}
