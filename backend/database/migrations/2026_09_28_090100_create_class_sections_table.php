<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// One row = one selectable "Year Level" or "Year Level + Section" the Admin has
// defined, so it appears in the browse flow even before any class is scheduled under
// it. College/Masteral rows point at a course; Basic Ed rows carry their own
// level_label (Elementary / Junior High School / Senior High School) instead.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_sections', function (Blueprint $table) {
            $table->id('class_section_id');
            $table->string('education_level');
            $table->foreignId('course_id')->nullable()->constrained('courses', 'course_id')->cascadeOnDelete();
            $table->string('level_label')->nullable();
            $table->string('year_label');
            $table->string('strand')->nullable();
            $table->string('section_name')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_sections');
    }
};
