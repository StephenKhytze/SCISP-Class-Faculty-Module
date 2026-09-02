<?php

namespace App\Http\Controllers\Schedule;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        $query = Schedule::with(['subject', 'faculty'])->orderBy('start_time');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('room', 'like', "%{$search}%")
                    ->orWhereHas('subject', function ($sq) use ($search) {
                        $sq->where('subject_code', 'like', "%{$search}%")
                            ->orWhere('subject_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($level = $request->query('level')) {
            $query->where('level', $level);
        }

        if ($year = $request->query('year')) {
            $query->where('year', $year);
        }

        if ($day = $request->query('day')) {
            $query->where('day', $day);
        }

        return response()->json($query->get());
    }
}
