<?php

namespace App\Http\Controllers\Schedule;

use App\Http\Controllers\Controller;
use App\Models\ClassSection;
use Illuminate\Http\Request;

class ClassSectionController extends Controller
{
    public function index(Request $request)
    {
        $query = ClassSection::with('course');

        if ($request->boolean('archived')) {
            $query->whereNotNull('archived_at');
        } else {
            $query->whereNull('archived_at');
        }

        if ($educationLevel = $request->query('education_level')) {
            $query->where('education_level', $educationLevel);
        }

        if ($courseId = $request->query('course_id')) {
            $query->where('course_id', $courseId);
        }

        if ($levelLabel = $request->query('level_label')) {
            $query->where('level_label', $levelLabel);
        }

        if ($yearLabel = $request->query('year_label')) {
            $query->where('year_label', $yearLabel);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'education_level' => 'required|in:College,Masteral,Basic Ed',
            'course_id' => 'nullable|exists:courses,course_id',
            'level_label' => 'nullable|string',
            'year_label' => 'required|string',
            'strand' => 'nullable|string',
            'section_name' => 'nullable|string',
        ]);

        // Re-adding a previously archived Year Level/Section/Strand brings it back instead
        // of leaving it archived under a "new" identical row. Every column is compared
        // explicitly (a field left out of the request means "this column is NULL", not
        // "ignore this column") - otherwise a placeholder registration such as "Add Strand"
        // (which never sends section_name) could match, and then archive, an unrelated real
        // section that happens to share the same education_level/level/year/strand.
        $matchData = array_merge([
            'course_id' => null,
            'level_label' => null,
            'strand' => null,
            'section_name' => null,
        ], $data);
        $existing = ClassSection::where($matchData)->first();
        if ($existing) {
            $existing->update(['archived_at' => null]);
            $section = $existing;
        } else {
            $section = ClassSection::create($data);
        }

        return response()->json($section->load('course'), 201);
    }

    public function archive(ClassSection $classSection)
    {
        $classSection->update(['archived_at' => now()]);

        return response()->json($classSection->load('course'));
    }

    public function restore(ClassSection $classSection)
    {
        $classSection->update(['archived_at' => null]);

        return response()->json($classSection->load('course'));
    }
}
