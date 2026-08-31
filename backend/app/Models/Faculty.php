<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Faculty extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'position',
        'department',
        'college',
        'building',
        'room',
        'local_ext',
        'email',
        'office_hours',
        'specializations',
        'photo_url',
        'availability_status',
        'status_detail',
    ];

    protected $casts = [
        'specializations' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function bookings()
    {
        return $this->hasMany(ConsultationBooking::class);
    }
}
