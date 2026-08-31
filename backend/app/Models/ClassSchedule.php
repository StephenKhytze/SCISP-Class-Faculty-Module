<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassSchedule extends Model
{
    protected $fillable = [
        'subject_code',
        'subject_name',
        'room',
        'day_of_week',
        'start_time',
        'end_time',
        'course',
        'year_level',
        'semester',
        'faculty_id',
    ];

    protected $casts = [
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
    ];

    public function faculty()
    {
        return $this->belongsTo(Faculty::class);
    }
}
