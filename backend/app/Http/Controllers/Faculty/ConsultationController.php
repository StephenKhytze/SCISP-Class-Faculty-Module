<?php

namespace App\Http\Controllers\Faculty;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\Faculty;
use Illuminate\Http\Request;

class ConsultationController extends Controller
{
    public function index(Request $request, Faculty $faculty)
    {
        $query = $faculty->consultations()->orderBy('consultation_date')->orderBy('consultation_time');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($month = $request->query('month')) {
            $query->whereRaw("DATE_FORMAT(consultation_date, '%Y-%m') = ?", [$month]);
        }

        return response()->json($query->get());
    }

    public function all(Request $request)
    {
        $query = Consultation::with('faculty')->orderBy('consultation_date')->orderBy('consultation_time');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return response()->json($query->get());
    }

    public function mine(Request $request)
    {
        $consultations = Consultation::where('student_id', $request->user()->user_id)
            ->with('faculty')
            ->orderBy('consultation_date')
            ->orderBy('consultation_time')
            ->get();

        return response()->json($consultations);
    }

    public function store(Request $request, Faculty $faculty)
    {
        $data = $request->validate([
            'consultation_date' => 'required|date',
            'consultation_time' => 'required',
            'student_name' => 'nullable|string',
        ]);

        $consultation = $faculty->consultations()->create([
            'student_id' => $request->user()->user_id,
            'student_name' => $data['student_name'] ?? $request->user()->username,
            'consultation_date' => $data['consultation_date'],
            'consultation_time' => $data['consultation_time'],
            'status' => 'pending',
        ]);

        return response()->json($consultation, 201);
    }

    public function updateStatus(Request $request, Consultation $consultation)
    {
        $data = $request->validate([
            'status' => 'required|in:pending,approved,declined,completed',
        ]);

        $consultation->update($data);

        return response()->json($consultation);
    }
}
