<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoomType extends Model
{
    protected $primaryKey = 'room_type_id';

    protected $fillable = ['name', 'archived_at'];

    protected $casts = [
        'archived_at' => 'datetime',
    ];
}
