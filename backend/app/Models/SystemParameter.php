<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemParameter extends Model
{
    use HasFactory;

    protected $table = 'system_parameters';

    protected $fillable = [
        'key',
        'value',
        'description',
        'type',
        'updated_by',
    ];

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public static function getValue($key, $default = null)
    {
        $parameter = self::where('key', $key)->first();
        return $parameter ? $parameter->value : $default;
    }

    public static function setValue($key, $value, $description = null, $type = 'string', $adminId = null)
    {
        return self::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'description' => $description,
                'type' => $type,
                'updated_by' => $adminId,
            ]
        );
    }
}
