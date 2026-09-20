<?php

namespace App\Http\Controllers\Schedule;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\Subject;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        $query = Schedule::with(['subject', 'faculty'])->orderBy('start_time');

        if ($request->boolean('archived')) {
            $query->whereNotNull('archived_at');
        } else {
            $query->whereNull('archived_at');
        }

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

    public function store(Request $request)
    {
        $data = $this->validateSchedule($request);

        $schedule = Schedule::create($data);

        return response()->json($schedule->load(['subject', 'faculty']), 201);
    }

    public function update(Request $request, Schedule $schedule)
    {
        $data = $this->validateSchedule($request);

        $schedule->update($data);

        return response()->json($schedule->load(['subject', 'faculty']));
    }

    private function validateSchedule(Request $request): array
    {
        $data = $request->validate([
            'subject_id' => 'nullable|exists:subjects,subject_id',
            'new_subject_code' => 'required_without:subject_id|nullable|string',
            'new_subject_name' => 'required_without:subject_id|nullable|string',
            'faculty_id' => 'required|exists:faculty,faculty_id',
            'room' => 'nullable|string',
            'level' => 'nullable|string',
            'year' => 'nullable|string',
            'section' => 'nullable|string',
            'day' => 'required|string',
            'start_time' => 'required',
            'end_time' => 'required',
        ]);

        if (empty($data['subject_id'])) {
            $subject = Subject::firstOrCreate(
                ['subject_code' => $data['new_subject_code']],
                ['subject_name' => $data['new_subject_name'], 'category' => 'Major']
            );
            $data['subject_id'] = $subject->subject_id;
        }

        unset($data['new_subject_code'], $data['new_subject_name']);

        return $data;
    }

    public function archive(Schedule $schedule)
    {
        $schedule->update(['archived_at' => now()]);

        return response()->json($schedule->load(['subject', 'faculty']));
    }

    public function restore(Schedule $schedule)
    {
        $schedule->update(['archived_at' => null]);

        return response()->json($schedule->load(['subject', 'faculty']));
    }
}
