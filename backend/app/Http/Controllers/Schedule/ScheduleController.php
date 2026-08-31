<?php

namespace App\Http\Controllers\Schedule;

use App\Http\Controllers\Controller;
use App\Models\ClassSchedule;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        $query = ClassSchedule::with('faculty')->orderBy('start_time');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('subject_code', 'like', "%{$search}%")
                    ->orWhere('subject_name', 'like', "%{$search}%")
                    ->orWhere('room', 'like', "%{$search}%");
            });
        }

        if ($course = $request->query('course')) {
            $query->where('course', $course);
        }

        if ($yearLevel = $request->query('year_level')) {
            $query->where('year_level', $yearLevel);
        }

        if ($semester = $request->query('semester')) {
            $query->where('semester', $semester);
        }

        if ($day = $request->query('day')) {
            $query->where('day_of_week', $day);
        }

        return response()->json($query->get());
    }
}
