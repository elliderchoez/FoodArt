<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mensaje extends Model
{
    use HasFactory;

    protected $fillable = [
        'remitente_id',
        'destinatario_id',
        'contenido',
        'leido',
        'leido_at',
    ];

    protected $casts = [
        'leido_at' => 'datetime',
    ];

    public function remitente()
    {
        return $this->belongsTo(User::class, 'remitente_id');
    }

    public function destinatario()
    {
        return $this->belongsTo(User::class, 'destinatario_id');
    }
}
