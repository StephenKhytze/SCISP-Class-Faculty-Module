<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    protected $primaryKey = 'subject_id';

    protected $fillable = [
        'subject_code',
        'subject_name',
        'description',
        'category',
    ];

    public function schedules()
    {
        return $this->hasMany(Schedule::class, 'subject_id', 'subject_id');
    }
}
