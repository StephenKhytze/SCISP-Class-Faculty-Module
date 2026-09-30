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

        $course = Course::firstOrCreate(
            ['education_level' => $data['education_level'], 'code' => $data['code']],
            ['name' => $data['name']]
        );

        return response()->json($course, 201);
    }
}
