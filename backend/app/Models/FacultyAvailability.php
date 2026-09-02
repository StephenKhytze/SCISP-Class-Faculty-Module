<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FacultyAvailability extends Model
{
    protected $table = 'faculty_availability';
    protected $primaryKey = 'availability_id';

    protected $fillable = [
        'faculty_id',
        'day',
        'start_time',
        'end_time',
        'status',
    ];

    protected $casts = [
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
    ];

    public function faculty()
    {
        return $this->belongsTo(Faculty::class, 'faculty_id', 'faculty_id');
    }
}
