<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsultationBooking extends Model
{
    protected $fillable = [
        'faculty_id',
        'student_name',
        'student_email',
        'booking_date',
        'start_time',
        'end_time',
        'status',
        'notes',
    ];

    protected $casts = [
        'booking_date' => 'date:Y-m-d',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
    ];

    public function faculty()
    {
        return $this->belongsTo(Faculty::class);
    }
}
