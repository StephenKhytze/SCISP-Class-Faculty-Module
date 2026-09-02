<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Consultation extends Model
{
    protected $primaryKey = 'consultation_id';

    protected $fillable = [
        'faculty_id',
        'student_id',
        'student_name',
        'consultation_date',
        'consultation_time',
        'status',
    ];

    protected $casts = [
        'consultation_date' => 'date:Y-m-d',
        'consultation_time' => 'datetime:H:i',
    ];

    public function faculty()
    {
        return $this->belongsTo(Faculty::class, 'faculty_id', 'faculty_id');
    }
}
