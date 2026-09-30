<?php

namespace App\Http\Controllers\Schedule;

use App\Http\Controllers\Controller;
use App\Models\Room;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function index(Request $request)
    {
        $query = Room::query();

        if ($request->boolean('archived')) {
            $query->whereNotNull('archived_at');
        } else {
            $query->whereNull('archived_at');
        }

        if ($building = $request->query('building')) {
            $query->where('building', $building);
        }

        if ($roomType = $request->query('room_type')) {
            $query->where('room_type', $roomType);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('room_code', 'like', "%{$search}%")
                    ->orWhere('room_name', 'like', "%{$search}%")
                    ->orWhere('building', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('building')->orderBy('room_code')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'room_code' => 'required|string|max:50',
            'room_name' => 'nullable|string|max:255',
            'building' => 'required|string|max:255',
            // Room Type is its own managed masterlist now (see RoomTypeController), not a
            // fixed enum - any non-empty name the admin picked/added there is accepted here.
            'room_type' => 'required|string|max:100',
            'capacity' => 'nullable|integer|min:1',
        ]);

        if ($duplicate = $this->findDuplicateCode($data['room_code'])) {
            return $this->duplicateResponse($duplicate);
        }

        $room = Room::create($data);

        return response()->json($room, 201);
    }

    public function update(Request $request, Room $room)
    {
        $data = $request->validate([
            'room_code' => 'required|string|max:50',
            'room_name' => 'nullable|string|max:255',
            'building' => 'required|string|max:255',
            'room_type' => 'required|string|max:100',
            'capacity' => 'nullable|integer|min:1',
        ]);

        if ($duplicate = $this->findDuplicateCode($data['room_code'], $room->room_id)) {
            return $this->duplicateResponse($duplicate);
        }

        $room->update($data);

        return response()->json($room);
    }

    public function archive(Room $room)
    {
        $room->update(['archived_at' => now()]);

        return response()->json($room);
    }

    public function restore(Room $room)
    {
        $room->update(['archived_at' => null]);

        return response()->json($room);
    }

    // Same normalized-duplicate guard as subjects - "BA101" and "BA-101" are the same room
    // code with a stray hyphen, not two different rooms. Includes archived rooms too, since
    // room_code is meant to stay a stable identifier even for a room taken out of rotation.
    private function findDuplicateCode(string $code, ?int $excludeId = null): ?Room
    {
        $normalized = strtoupper(preg_replace('/[\s-]+/', '', $code));

        return Room::when($excludeId, fn ($q) => $q->where('room_id', '!=', $excludeId))
            ->get()
            ->first(fn (Room $r) => strtoupper(preg_replace('/[\s-]+/', '', $r->room_code)) === $normalized);
    }

    private function duplicateResponse(Room $existing)
    {
        $message = $existing->archived_at
            ? "This code was already used by an archived room: {$existing->room_code} ({$existing->building}). Restore it instead of creating a new one."
            : "A room with a matching code already exists: {$existing->room_code} ({$existing->building}).";

        return response()->json(['message' => $message, 'existing_room' => $existing], 422);
    }
}
