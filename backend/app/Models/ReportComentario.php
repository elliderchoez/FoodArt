<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportComentario extends Model
{
    use HasFactory;

    protected $table = 'report_comentarios';

    protected $fillable = [
        'comentario_id',
        'receta_id',
        'reported_user_id',
        'reporter_id',
        'reason',
        'description',
        'status',
        'admin_response',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function comentario()
    {
        return $this->belongsTo(Comentario::class, 'comentario_id');
    }

    public function receta()
    {
        return $this->belongsTo(Receta::class, 'receta_id');
    }

    public function reportedUser()
    {
        return $this->belongsTo(User::class, 'reported_user_id');
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
