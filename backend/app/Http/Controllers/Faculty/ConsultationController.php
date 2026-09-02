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

    public function updateStatus(Request $request, Consultation $consultation)
    {
        $data = $request->validate([
            'status' => 'required|in:pending,approved,declined,completed',
        ]);

        $consultation->update($data);

        return response()->json($consultation);
    }
}
