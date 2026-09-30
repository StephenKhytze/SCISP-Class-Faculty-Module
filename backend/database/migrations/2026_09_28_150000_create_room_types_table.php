<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

// Room Type stops being a fixed enum and becomes its own small managed masterlist, same
// pattern as Rooms/Subjects/Sections - an admin can add a new type (e.g. "Music Room") or
// archive one they no longer use, instead of being stuck with the 4 originally hardcoded.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_types', function (Blueprint $table) {
            $table->id('room_type_id');
            $table->string('name')->unique();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
        });

        $now = now();
        foreach (['Lecture Room', 'Computer Lab', 'Science Lab', 'Auditorium'] as $name) {
            DB::table('room_types')->insert(['name' => $name, 'created_at' => $now, 'updated_at' => $now]);
        }

        // rooms.room_type was a fixed enum ('LECTURE','COMPUTER_LAB',...) - switch it to a
        // free string so it can hold any room_types.name, and rewrite existing rows from
        // the old enum codes to the new human-readable labels above.
        Schema::table('rooms', function (Blueprint $table) {
            $table->string('room_type_new')->default('Lecture Room')->after('room_type');
        });

        $codeToLabel = [
            'LECTURE' => 'Lecture Room',
            'COMPUTER_LAB' => 'Computer Lab',
            'SCIENCE_LAB' => 'Science Lab',
            'AUDITORIUM' => 'Auditorium',
        ];
        foreach ($codeToLabel as $code => $label) {
            DB::table('rooms')->where('room_type', $code)->update(['room_type_new' => $label]);
        }

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('room_type');
        });
        Schema::table('rooms', function (Blueprint $table) {
            $table->renameColumn('room_type_new', 'room_type');
        });
    }

    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->string('room_type_old')->default('LECTURE')->after('room_type');
        });
        $labelToCode = [
            'Lecture Room' => 'LECTURE',
            'Computer Lab' => 'COMPUTER_LAB',
            'Science Lab' => 'SCIENCE_LAB',
            'Auditorium' => 'AUDITORIUM',
        ];
        foreach ($labelToCode as $label => $code) {
            DB::table('rooms')->where('room_type', $label)->update(['room_type_old' => $code]);
        }
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('room_type');
        });
        Schema::table('rooms', function (Blueprint $table) {
            $table->renameColumn('room_type_old', 'room_type');
        });

        Schema::dropIfExists('room_types');
    }
};
