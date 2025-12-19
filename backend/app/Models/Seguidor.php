<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Seguidor extends Model
{
    protected $table = 'seguidor';
    protected $fillable = ['usuario_id', 'seguidor_id'];
    public $timestamps = true;

    /**
     * Relación con el usuario que es seguido
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    /**
     * Relación con el usuario que sigue
     */
    public function seguidor()
    {
        return $this->belongsTo(User::class, 'seguidor_id');
    }
}
