<?php

namespace App\Http\Controllers\Schedule;

use App\Http\Controllers\Controller;
use App\Models\RoomType;
use Illuminate\Http\Request;

class RoomTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = RoomType::query();

        if ($request->boolean('archived')) {
            $query->whereNotNull('archived_at');
        } else {
            $query->whereNull('archived_at');
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:100']);

        if ($duplicate = $this->findDuplicateName($data['name'])) {
            return $this->duplicateResponse($duplicate);
        }

        $type = RoomType::create($data);

        return response()->json($type, 201);
    }

    public function archive(RoomType $roomType)
    {
        $roomType->update(['archived_at' => now()]);

        return response()->json($roomType);
    }

    public function restore(RoomType $roomType)
    {
        $roomType->update(['archived_at' => null]);

        return response()->json($roomType);
    }

    private function findDuplicateName(string $name): ?RoomType
    {
        $normalized = strtoupper(preg_replace('/\s+/', '', $name));

        return RoomType::get()->first(fn (RoomType $t) => strtoupper(preg_replace('/\s+/', '', $t->name)) === $normalized);
    }

    private function duplicateResponse(RoomType $existing)
    {
        $message = $existing->archived_at
            ? "This name was already used by an archived room type: {$existing->name}. Restore it instead of creating a new one."
            : "A room type with a matching name already exists: {$existing->name}.";

        return response()->json(['message' => $message, 'existing_room_type' => $existing], 422);
    }
}
