<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Faculty extends Model
{
    protected $fillable = [
        'name',
        'position',
        'department',
        'college',
        'building',
        'room',
        'local_ext',
        'email',
        'office_hours',
        'specializations',
        'photo_url',
        'availability_status',
        'status_detail',
    ];

    protected $casts = [
        'specializations' => 'array',
    ];
}
