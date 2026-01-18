<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportReceta extends Model
{
    use HasFactory;

    protected $table = 'report_recetas';

    protected $fillable = [
        'receta_id',
        'usuario_id',
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

    public function receta()
    {
        return $this->belongsTo(Receta::class);
    }

    public function usuario()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
