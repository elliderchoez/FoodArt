<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'descripcion',
        'imagen_perfil',
        'expo_push_token',
        'role',
        'is_blocked',
        'blocked_at',
        'block_reason',
        'email_verified',
        'email_verification_token',
        'password_reset_token',
        'password_reset_expires',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_blocked' => 'boolean',
            'blocked_at' => 'datetime',
            'email_verified' => 'boolean',
            'password_reset_expires' => 'datetime',
        ];
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isBlocked()
    {
        return $this->is_blocked;
    }

    /**
     * Relación con recetas
     */
    public function recetas()
    {
        return $this->hasMany(Receta::class);
    }

    /**
     * Planes de comidas del usuario
     */
    public function mealPlans()
    {
        return $this->hasMany(MealPlan::class);
    }

    /**
     * Listas de compras del usuario
     */
    public function shoppingLists()
    {
        return $this->hasMany(ShoppingList::class);
    }
}
