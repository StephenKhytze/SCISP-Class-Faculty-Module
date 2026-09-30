<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassSection extends Model
{
    protected $primaryKey = 'class_section_id';

    protected $fillable = [
        'education_level',
        'course_id',
        'level_label',
        'year_label',
        'strand',
        'section_name',
        'archived_at',
    ];

    protected $casts = [
        'archived_at' => 'datetime',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id', 'course_id');
    }
}
