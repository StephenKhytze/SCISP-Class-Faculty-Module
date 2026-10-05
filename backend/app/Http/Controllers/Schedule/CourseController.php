<?php

namespace App\Http\Controllers\Schedule;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $query = Course::query();

        if ($educationLevel = $request->query('education_level')) {
            $query->where('education_level', $educationLevel);
        }

        return response()->json($query->orderBy('code')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'education_level' => 'required|in:College,Masteral',
            'code' => 'required|string|max:50',
            'name' => 'required|string|max:255',
        ]);

        // Normalized duplicate guard: "bsit", " BSIT " and "BSIT" are one course, not three.
        $code = strtoupper(trim(preg_replace('/\s+/', ' ', $data['code'])));
        $clash = Course::where('education_level', $data['education_level'])
            ->get()
            ->first(fn ($c) => strtoupper(trim($c->code)) === $code);
        if ($clash) {
            return response()->json(['message' => "{$clash->code} already exists.", 'existing' => $clash], 422);
        }

        $course = Course::create([
            'education_level' => $data['education_level'],
            'code' => $code,
            'name' => trim(preg_replace('/\s+/', ' ', $data['name'])),
        ]);

        return response()->json($course, 201);
    }
}
