<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FacultyConsultationHour extends Model
{
    protected $table = 'faculty_consultation_hours';
    protected $primaryKey = 'consult_id';

    protected $fillable = [
        'faculty_id',
        'day',
        'time',
    ];

    protected $casts = [
        'time' => 'datetime:H:i',
    ];

    public function faculty()
    {
        return $this->belongsTo(Faculty::class, 'faculty_id', 'faculty_id');
    }
}
