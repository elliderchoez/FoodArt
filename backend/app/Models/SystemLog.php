<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_id',
        'action',
        'entity_type',
        'entity_id',
        'description',
        'changes',
        'ip_address',
    ];

    protected $casts = [
        'changes' => 'json',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
