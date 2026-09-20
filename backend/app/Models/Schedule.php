<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    protected $primaryKey = 'schedule_id';

    protected $appends = ['subject_code', 'subject_name'];

    protected $fillable = [
        'subject_id',
        'education_level',
        'faculty_id',
        'room',
        'level',
        'year',
        'strand',
        'section',
        'day',
        'start_time',
        'end_time',
        'archived_at',
    ];

    protected $casts = [
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'archived_at' => 'datetime',
    ];

    public function getSubjectCodeAttribute(): ?string
    {
        return $this->subject?->subject_code;
    }

    public function getSubjectNameAttribute(): ?string
    {
        return $this->subject?->subject_name;
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id', 'subject_id');
    }

    public function faculty()
    {
        return $this->belongsTo(Faculty::class, 'faculty_id', 'faculty_id');
    }
}
