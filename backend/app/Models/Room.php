<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    protected $primaryKey = 'room_id';

    protected $fillable = [
        'room_code',
        'room_name',
        'building',
        'room_type',
        'capacity',
        'archived_at',
    ];

    protected $casts = [
        'archived_at' => 'datetime',
        'capacity' => 'integer',
    ];

    public function schedules()
    {
        return $this->hasMany(Schedule::class, 'room_id', 'room_id');
    }
}
