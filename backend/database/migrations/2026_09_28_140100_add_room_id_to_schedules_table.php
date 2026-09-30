<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Additive - the free-text `room` column stays exactly as-is and keeps being what every
// existing frontend read (conflict detection, timetable cells, PDF export, search) works
// off of, so none of that has to change. `room_id` is the new, structured source of truth
// going forward: the server derives `room`'s display text from it whenever a schedule is
// created/updated with a room_id, instead of the client ever sending raw room text.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->foreignId('room_id')->nullable()->after('room')->constrained('rooms', 'room_id')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->dropConstrainedForeignId('room_id');
        });
    }
};
