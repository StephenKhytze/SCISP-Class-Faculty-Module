<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Faculty extends Model
{
    protected $table = 'faculty';
    protected $primaryKey = 'faculty_id';

    protected $appends = ['name'];

    protected $fillable = [
        'user_id',
        'first_name',
        'middle_name',
        'last_name',
        'faculty_image',
        'department',
        'email_address',
        'position',
        'college',
        'building',
        'room',
        'local_ext',
        'office_hours',
        'specializations',
        'availability_status',
        'status_detail',
    ];

    protected $casts = [
        'specializations' => 'array',
    ];

    public function getNameAttribute(): string
    {
        return implode(' ', array_filter([$this->first_name, $this->middle_name, $this->last_name]));
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class, 'faculty_id', 'faculty_id');
    }

    public function consultations()
    {
        return $this->hasMany(Consultation::class, 'faculty_id', 'faculty_id');
    }

    public function consultationHours()
    {
        return $this->hasMany(FacultyConsultationHour::class, 'faculty_id', 'faculty_id');
    }

    public function availability()
    {
        return $this->hasMany(FacultyAvailability::class, 'faculty_id', 'faculty_id');
    }
}
