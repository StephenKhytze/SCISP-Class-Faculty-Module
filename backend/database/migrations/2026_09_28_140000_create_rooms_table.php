<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// The Room masterlist: every physical room a class can be scheduled in, picked from a
// searchable combobox in Add Schedule instead of typed freely (see schedules.room_id below).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->id('room_id');
            $table->string('room_code')->unique();
            $table->string('room_name')->nullable();
            $table->string('building');
            $table->enum('room_type', ['LECTURE', 'COMPUTER_LAB', 'SCIENCE_LAB', 'AUDITORIUM'])->default('LECTURE');
            $table->unsignedInteger('capacity')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
