<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $primaryKey = 'course_id';

    protected $fillable = [
        'education_level',
        'code',
        'name',
    ];

    public function classSections()
    {
        return $this->hasMany(ClassSection::class, 'course_id', 'course_id');
    }

    public function subjects()
    {
        return $this->hasMany(Subject::class, 'course_id', 'course_id');
    }
}
