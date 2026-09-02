<?php

namespace App\Http\Controllers\Faculty;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use Illuminate\Http\Request;

class FacultyController extends Controller
{
    public function index(Request $request)
    {
        $query = Faculty::query();

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

    public function me(Request $request)
    {
        $faculty = Faculty::where('user_id', $request->user()->user_id)->first();

        if (! $faculty) {
            return response()->json(['message' => 'No faculty profile linked to this account.'], 404);
        }

        return response()->json($faculty);
    }
}
