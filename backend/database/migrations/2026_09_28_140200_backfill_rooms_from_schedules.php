<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// One-time cleanup of every distinct free-text room string that had accumulated in
// schedules.room ("Room 101", "Rm 101", "Rm BA-101", ...) into a proper Room masterlist
// entry, then points every existing schedule at its matching room_id. Nothing already
// displayed anywhere changes - schedules.room keeps the exact same text it had.
return new class extends Migration
{
    public function up(): void
    {
        // raw room string => [room_code, room_name, building, room_type]
        $map = [
            '302' => ['302', null, 'IT Building', 'LECTURE'],
            'Graduate Room 1' => ['GR-1', 'Graduate Room 1', 'Graduate School Building', 'LECTURE'],
            'Graduate Room 2' => ['GR-2', 'Graduate Room 2', 'Graduate School Building', 'LECTURE'],
            'Graduate Room 3' => ['GR-3', 'Graduate Room 3', 'Graduate School Building', 'LECTURE'],
            'JHS-101' => ['JHS-101', null, 'Junior High Building', 'LECTURE'],
            'JHS-102' => ['JHS-102', null, 'Junior High Building', 'LECTURE'],
            'JHS-103' => ['JHS-103', null, 'Junior High Building', 'LECTURE'],
            'JHS-104' => ['JHS-104', null, 'Junior High Building', 'LECTURE'],
            'Rm 108' => ['108', null, 'IT Building', 'LECTURE'],
            'Rm 115' => ['115', null, 'IT Building', 'LECTURE'],
            'RM 126' => ['126', null, 'BA Building', 'LECTURE'],
            'Rm 205' => ['205', null, 'IT Building', 'LECTURE'],
            'Rm 206' => ['206', null, 'IT Building', 'LECTURE'],
            'Rm 207' => ['207', null, 'IT Building', 'LECTURE'],
            'Rm 208' => ['208', null, 'IT Building', 'LECTURE'],
            'Rm 209' => ['209', null, 'IT Building', 'LECTURE'],
            'Rm 210' => ['210', null, 'IT Building', 'LECTURE'],
            'Rm 211' => ['211', null, 'BA Building', 'LECTURE'],
            'Rm 212' => ['212', null, 'BA Building', 'LECTURE'],
            'Rm 213' => ['213', null, 'BA Building', 'LECTURE'],
            'Rm 214' => ['214', null, 'Education Building', 'LECTURE'],
            'Rm 215' => ['215', null, 'Education Building', 'LECTURE'],
            'Rm 216' => ['216', null, 'Education Building', 'LECTURE'],
            'Rm 301' => ['301', null, 'Graduate School Building', 'LECTURE'],
            'Rm 302' => ['302-G', null, 'Graduate School Building', 'LECTURE'],
            'Rm 303' => ['303', null, 'Graduate School Building', 'LECTURE'],
            'Rm 321' => ['321', null, 'IT Building', 'LECTURE'],
            'Rm 402' => ['402', 'Computer Lab 2', 'IT Building', 'COMPUTER_LAB'],
            'Rm 501' => ['501', null, 'IT Building', 'LECTURE'],
            'Rm BA-101' => ['BA-101', null, 'BA Building', 'LECTURE'],
            'Rm ED-101' => ['ED-101', null, 'Education Building', 'LECTURE'],
            'Rm TEST' => ['TEST', null, 'IT Building', 'LECTURE'],
            'Room 101' => ['101', null, 'Elementary Building', 'LECTURE'],
            'Room 102' => ['102', null, 'Elementary Building', 'LECTURE'],
            'Room 103' => ['103', null, 'Elementary Building', 'LECTURE'],
            'Room 104' => ['104', null, 'Elementary Building', 'LECTURE'],
            'Room 105' => ['105', null, 'Elementary Building', 'LECTURE'],
            'Room 106' => ['106', null, 'Elementary Building', 'LECTURE'],
            'Science Laboratory' => ['SCI-LAB', 'Science Laboratory', 'Senior High Building', 'SCIENCE_LAB'],
            'SHS-201' => ['SHS-201', null, 'Senior High Building', 'LECTURE'],
            'SHS-202' => ['SHS-202', null, 'Senior High Building', 'LECTURE'],
            'SHS-203' => ['SHS-203', null, 'Senior High Building', 'LECTURE'],
            'SHS-204' => ['SHS-204', null, 'Senior High Building', 'LECTURE'],
        ];

        $now = now();
        foreach ($map as $rawRoom => [$code, $name, $building, $type]) {
            $roomId = DB::table('rooms')->where('room_code', $code)->value('room_id');
            if (! $roomId) {
                $roomId = DB::table('rooms')->insertGetId([
                    'room_code' => $code,
                    'room_name' => $name,
                    'building' => $building,
                    'room_type' => $type,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
            // PHP casts a numeric-looking array key like '302' to an int, which then gets
            // bound as an integer and confuses MySQL's strict-mode comparison against the
            // varchar `room` column (it tries to numeric-cast every row's text to compare) -
            // force it back to a string so this stays a plain text match.
            DB::table('schedules')->where('room', (string) $rawRoom)->update(['room_id' => $roomId]);
        }
    }

    public function down(): void
    {
        DB::table('schedules')->update(['room_id' => null]);
        DB::table('rooms')->truncate();
    }
};
