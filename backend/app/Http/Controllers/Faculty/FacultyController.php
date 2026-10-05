<?php

namespace App\Http\Controllers\Faculty;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use Illuminate\Http\Request;

class FacultyController extends Controller
{
    // Grade 1-6 (Elementary), Grade 7-10 (Junior High School), Grade 11-12 (Senior High
    // School) - matches BASIC_ED_YEAR_GROUPS on the frontend (schedule/constants.js).
    private const GRADE_LABELS = 'Grade 1,Grade 2,Grade 3,Grade 4,Grade 5,Grade 6,Grade 7,Grade 8,Grade 9,Grade 10,Grade 11,Grade 12';

    public function index(Request $request)
    {
        $query = Faculty::query();

        // Archived teachers are hidden from every active list (directory, schedule instructor
        // picker) unless explicitly requested; their schedules and history stay untouched.
        if ($request->boolean('archived')) {
            $query->whereNotNull('archived_at');
        } else {
            $query->whereNull('archived_at');
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('room', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%");
            });
        }

        if ($department = $request->query('department')) {
            $query->where('department', $department);
        }

        if ($position = $request->query('position')) {
            $query->where('position', $position);
        }

        if ($specialization = $request->query('specialization')) {
            $query->whereJsonContains('specializations', $specialization);
        }

        if ($status = $request->query('status')) {
            $query->where('availability_status', $status);
        }

        return response()->json($query->orderBy('last_name')->get());
    }

    public function show(Faculty $faculty)
    {
        return response()->json($faculty);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name' => 'required|string',
            'middle_name' => 'nullable|string',
            'last_name' => 'required|string',
            'department' => 'required|string',
            'email_address' => 'required|email',
            'position' => 'required|string',
            'college' => 'required|string',
            'building' => 'required|string',
            'room' => 'required|string',
            'local_ext' => 'nullable|string',
            'office_hours' => 'nullable|string',
            'specializations' => 'nullable|array',
            'teaching_levels' => 'nullable|array',
            'teaching_levels.*' => 'in:College,Masteral,Elementary,Junior High School,Senior High School',
            'teaching_grades' => 'nullable|array',
            'teaching_grades.*' => 'in:' . self::GRADE_LABELS,
            'availability_status' => 'required|in:available,in_class,off_campus,consultation_hours,on_leave',
            'status_detail' => 'nullable|string',
        ]);

        $faculty = Faculty::create($data);

        return response()->json($faculty, 201);
    }

    public function update(Request $request, Faculty $faculty)
    {
        // Admins edit anyone; a teacher may only edit the profile linked to their own account.
        $user = $request->user();
        if (! $user->isAdmin() && (int) $faculty->user_id !== (int) $user->user_id) {
            return response()->json(['message' => 'You can only edit your own faculty profile.'], 403);
        }

        $data = $request->validate([
            'first_name' => 'required|string',
            'middle_name' => 'nullable|string',
            'last_name' => 'required|string',
            'department' => 'required|string',
            'email_address' => 'required|email',
            'position' => 'required|string',
            'college' => 'required|string',
            'building' => 'required|string',
            'room' => 'required|string',
            'local_ext' => 'nullable|string',
            'office_hours' => 'nullable|string',
            'specializations' => 'nullable|array',
            'teaching_levels' => 'nullable|array',
            'teaching_levels.*' => 'in:College,Masteral,Elementary,Junior High School,Senior High School',
            'teaching_grades' => 'nullable|array',
            'teaching_grades.*' => 'in:' . self::GRADE_LABELS,
            'availability_status' => 'required|in:available,in_class,off_campus,consultation_hours,on_leave',
            'status_detail' => 'nullable|string',
        ]);

        $faculty->update($data);

        return response()->json($faculty);
    }

    public function archive(Faculty $faculty)
    {
        $faculty->update(['archived_at' => now()]);

        return response()->json($faculty);
    }

    public function restore(Faculty $faculty)
    {
        $faculty->update(['archived_at' => null]);

        return response()->json($faculty);
    }

    public function me(Request $request)
    {
        $faculty = Faculty::where('user_id', $request->user()->user_id)->first();

        if (! $faculty) {
            return response()->json(['message' => 'No faculty profile linked to this account.'], 404);
        }

        return response()->json($faculty);
    }
}
