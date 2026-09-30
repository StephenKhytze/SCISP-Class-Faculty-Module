<?php

namespace App\Http\Controllers\Schedule;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Subject::query();

        if ($request->boolean('archived')) {
            $query->whereNotNull('archived_at');
        } elseif (!$request->boolean('all')) {
            $query->whereNull('archived_at');
        }

        if ($courseId = $request->query('course_id')) {
            $query->where('course_id', $courseId);
        }

        if ($yearLabel = $request->query('year_label')) {
            $query->where('year_label', $yearLabel);
        }

        if ($strand = $request->query('strand')) {
            $query->where('strand', $strand);
        }

        return response()->json($query->orderBy('subject_code')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'subject_code' => 'required|string|max:50',
            'subject_name' => 'required|string|max:255',
            'category' => 'nullable|string',
            'course_id' => 'nullable|exists:courses,course_id',
            'year_label' => 'nullable|string',
            'strand' => 'nullable|string',
        ]);

        if ($duplicate = $this->findDuplicateCode($data['subject_code'])) {
            return $this->duplicateResponse($duplicate);
        }

        $data['category'] = $data['category'] ?? 'Major';

        $subject = Subject::create($data);

        return response()->json($subject, 201);
    }

    public function update(Request $request, Subject $subject)
    {
        $data = $request->validate([
            'subject_code' => 'required|string|max:50',
            'subject_name' => 'required|string|max:255',
            'category' => 'nullable|string',
            'course_id' => 'nullable|exists:courses,course_id',
            'year_label' => 'nullable|string',
            'strand' => 'nullable|string',
        ]);

        if ($duplicate = $this->findDuplicateCode($data['subject_code'], $subject->subject_id)) {
            return $this->duplicateResponse($duplicate);
        }

        $subject->update($data);

        return response()->json($subject);
    }

    public function archive(Subject $subject)
    {
        $subject->update(['archived_at' => now()]);

        return response()->json($subject);
    }

    public function restore(Subject $subject)
    {
        $subject->update(['archived_at' => null]);

        return response()->json($subject);
    }

    // A subject code is meant to be a single, unique catalog entry - "MATH1" and "MATH 1"
    // are the same code with a stray space, not two different subjects. Comparing them with
    // whitespace stripped catches that even though the database's own unique constraint
    // (case-insensitive, but whitespace-sensitive) would let it through as a "new" code.
    // Archived subjects are included in the check, not excluded - the subject_code column
    // has a hard unique constraint regardless of archived_at, so an archived subject's code
    // genuinely isn't free to reuse; the caller needs to restore it, not recreate it.
    private function findDuplicateCode(string $code, ?int $excludeId = null): ?Subject
    {
        $normalized = strtoupper(preg_replace('/\s+/', '', $code));

        return Subject::when($excludeId, fn ($q) => $q->where('subject_id', '!=', $excludeId))
            ->get()
            ->first(fn (Subject $s) => strtoupper(preg_replace('/\s+/', '', $s->subject_code)) === $normalized);
    }

    private function duplicateResponse(Subject $existing)
    {
        $message = $existing->archived_at
            ? "This code was already used by an archived subject: {$existing->subject_code} ({$existing->subject_name}). Restore it instead of creating a new one."
            : "A subject with a matching code already exists: {$existing->subject_code} ({$existing->subject_name}).";

        return response()->json([
            'message' => $message,
            'existing_subject' => $existing,
        ], 422);
    }
}
