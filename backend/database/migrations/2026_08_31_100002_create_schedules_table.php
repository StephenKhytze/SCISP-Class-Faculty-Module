<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id('schedule_id');
            $table->foreignId('subject_id')->constrained('subjects', 'subject_id')->cascadeOnDelete();
            $table->foreignId('faculty_id')->constrained('faculty', 'faculty_id')->cascadeOnDelete();

            $table->string('room')->nullable();
            $table->string('level')->nullable();
            $table->string('year')->nullable();
            $table->string('section')->nullable();

            $table->string('day');
            $table->time('start_time');
            $table->time('end_time');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
