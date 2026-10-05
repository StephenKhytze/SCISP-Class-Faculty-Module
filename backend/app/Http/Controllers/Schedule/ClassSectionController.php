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
        // Strands are an open list - no fixed count, no "archive one first" rule. The only
        // guard is against duplicates: the same name (case/extra-spaces insensitive) already
        // active in this grade is rejected, and one that exists archived is pointed back to
        // the restore flow instead of being recreated as a second row.
        // Section names and year levels get the same normalized duplicate guard as strands:
        // "Section A", "section a", and " Section A " are one record, not three.
        if (! empty($data['section_name'])) {
            $data['section_name'] = trim(preg_replace('/\s+/', ' ', $data['section_name']));
            $sameScope = ClassSection::where('education_level', $data['education_level'])
                ->where('course_id', $data['course_id'] ?? null)
                ->where('level_label', $data['level_label'] ?? null)
                ->where('year_label', $data['year_label'])
                ->where('strand', $data['strand'] ?? null)
                ->whereNotNull('section_name')
                ->get();
            $clash = $sameScope->first(fn ($s) => mb_strtolower(trim($s->section_name)) === mb_strtolower($data['section_name']));
            if ($clash) {
                $message = $clash->archived_at
                    ? "{$clash->section_name} already exists but is archived. Restore it from Archived Sections."
                    : "{$clash->section_name} already exists.";
                return response()->json(['message' => $message, 'existing' => $clash], 422);
            }
        } elseif (! empty($data['year_label']) && empty($data['strand'])) {
            $data['year_label'] = trim(preg_replace('/\s+/', ' ', $data['year_label']));
            $sameYears = ClassSection::where('education_level', $data['education_level'])
                ->where('course_id', $data['course_id'] ?? null)
                ->where('level_label', $data['level_label'] ?? null)
                ->whereNull('section_name')
                ->whereNull('strand')
                ->get();
            $clash = $sameYears->first(fn ($s) => mb_strtolower(trim($s->year_label)) === mb_strtolower($data['year_label']));
            if ($clash) {
                $message = $clash->archived_at
                    ? "{$clash->year_label} already exists but is archived. Restore it from Archived Year Levels."
                    : "{$clash->year_label} already exists.";
                return response()->json(['message' => $message, 'existing' => $clash], 422);
            }
        }

        if (! empty($data['strand']) && empty($data['section_name'])) {
            $data['strand'] = trim(preg_replace('/\s+/', ' ', $data['strand']));
            $normalized = mb_strtolower($data['strand']);

            $sameStrandRows = ClassSection::where('education_level', $data['education_level'])
                ->where('level_label', $data['level_label'] ?? null)
                ->where('year_label', $data['year_label'])
                ->whereNull('section_name')
                ->whereNotNull('strand')
                ->get();
            $clash = $sameStrandRows->first(fn ($s) => mb_strtolower(trim($s->strand)) === $normalized);

            if ($clash) {
                $message = $clash->archived_at
                    ? "{$clash->strand} already exists but is archived. Restore it from Archived Strands."
                    : "{$clash->strand} already exists.";
                return response()->json(['message' => $message, 'existing' => $clash], 422);
            }
        }

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
