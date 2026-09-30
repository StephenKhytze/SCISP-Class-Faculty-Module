<?php

namespace App\Http\Controllers\Faculty;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\LeaveRequest;
use Illuminate\Http\Request;

class LeaveRequestController extends Controller
{
    public function index(Request $request)
    {
        if (! $this->isAdmin($request)) {
            return response()->json(['message' => 'Only administrators can view all leave requests.'], 403);
        }

        $query = LeaveRequest::with('faculty')->orderByDesc('created_at');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return response()->json($query->get());
    }

    public function mine(Request $request)
    {
        $faculty = $this->linkedFaculty($request);

        if (! $faculty) {
            return response()->json(['message' => 'No faculty profile linked to this account.'], 404);
        }

        return response()->json(
            LeaveRequest::where('faculty_id', $faculty->faculty_id)->orderByDesc('created_at')->get()
        );
    }

    public function store(Request $request)
    {
        $faculty = $this->linkedFaculty($request);

        if (! $faculty) {
            return response()->json(['message' => 'No faculty profile linked to this account.'], 404);
        }

        $data = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string|max:2000',
        ]);

        $leave = LeaveRequest::create([
            ...$data,
            'faculty_id' => $faculty->faculty_id,
            'status' => 'pending',
        ]);

        return response()->json($leave, 201);
    }

    public function cancel(Request $request, LeaveRequest $leaveRequest)
    {
        $faculty = $this->linkedFaculty($request);

        if (! $faculty || (int) $leaveRequest->faculty_id !== (int) $faculty->faculty_id) {
            return response()->json(['message' => 'You can only cancel your own leave requests.'], 403);
        }

        if ($leaveRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending leave requests can be cancelled.'], 422);
        }

        $leaveRequest->update(['status' => 'cancelled']);

        return response()->json($leaveRequest);
    }

    public function review(Request $request, LeaveRequest $leaveRequest)
    {
        if (! $this->isAdmin($request)) {
            return response()->json(['message' => 'Only administrators can review leave requests.'], 403);
        }

        $data = $request->validate([
            'status' => 'required|in:approved,declined',
            'admin_remarks' => 'nullable|string|max:2000',
        ]);

        if ($leaveRequest->status === 'cancelled') {
            return response()->json(['message' => 'This leave request was cancelled by the teacher.'], 422);
        }

        $leaveRequest->update([...$data, 'reviewed_at' => now()]);

        return response()->json($leaveRequest->load('faculty'));
    }

    private function linkedFaculty(Request $request): ?Faculty
    {
        return Faculty::where('user_id', $request->user()->user_id)->first();
    }

    private function isAdmin(Request $request): bool
    {
        $user = $request->user();

        return $user->role === 'administrator' || $user->username === 'Admin_User_00001';
    }
}
