<?php

namespace App\Http\Controllers\Schedule;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\Schedule;
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

        if ($educationLevel = $request->query('education_level')) {
            $query->where('education_level', $educationLevel);
        }

        if ($level = $request->query('level')) {
            $query->where('level', $level);
        }

        if ($year = $request->query('year')) {
            $query->where('year', $year);
        }

        if ($strand = $request->query('strand')) {
            $query->where('strand', $strand);
        }

        if ($day = $request->query('day')) {
            $query->where('day', $day);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $this->validateSchedule($request);
        $this->assertInstructorIsActive($data['faculty_id']);

        $schedule = Schedule::create($data);

        return response()->json($schedule->load(['subject', 'faculty']), 201);
    }

    public function update(Request $request, Schedule $schedule)
    {
        $data = $this->validateSchedule($request);
        // Keeping an already-archived teacher on an existing class is fine (history); only
        // choosing a different archived teacher is refused.
        if ((string) $data['faculty_id'] !== (string) $schedule->faculty_id) {
            $this->assertInstructorIsActive($data['faculty_id']);
        }

        $schedule->update($data);

        return response()->json($schedule->load(['subject', 'faculty']));
    }

    // Archived teachers can't be newly assigned to a class. Their existing schedules and
    // names stay readable - this only guards the assignment step.
    private function assertInstructorIsActive($facultyId): void
    {
        $archived = \App\Models\Faculty::whereNotNull('archived_at')->where('faculty_id', $facultyId)->exists();
        if ($archived) {
            abort(response()->json(['message' => 'That teacher is archived. Restore them first before assigning a class.'], 422));
        }
    }

    private function validateSchedule(Request $request): array
    {
        // Subjects are no longer created on the fly from here - a subject must already
        // exist (added through Manage Subjects, properly tagged to its course/year level)
        // before it can be scheduled. This is what keeps the subject catalog scoped instead
        // of accumulating untagged, system-wide entries every time a class is added.
        $data = $request->validate([
            'subject_id' => 'required|exists:subjects,subject_id',
            'room_id' => 'nullable|exists:rooms,room_id',
            'education_level' => 'required|in:College,Masteral,Basic Ed',
            'faculty_id' => 'required|exists:faculty,faculty_id',
            'level' => 'nullable|string',
            'year' => 'nullable|string',
            'strand' => 'nullable|string',
            'section' => 'nullable|string',
            // Matches SCHEDULE_DAYS on the frontend (schedule/constants.js).
            'day' => 'required|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'start_time' => 'required|date_format:H:i,H:i:s',
            'end_time' => 'required|date_format:H:i,H:i:s|after:start_time',
        ], [
            'end_time.after' => 'The end time must be later than the start time.',
        ]);

        // The client only ever sends room_id now (picked from the Room combobox) - the
        // server derives the display string, so no raw room text ever comes from the form.
        if (array_key_exists('room_id', $data)) {
            $room = $data['room_id'] ? Room::find($data['room_id']) : null;
            $data['room'] = $room ? trim("{$room->room_code} • {$room->building}") : null;
        }

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
