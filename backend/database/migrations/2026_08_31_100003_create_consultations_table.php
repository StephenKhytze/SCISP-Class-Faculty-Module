<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultations', function (Blueprint $table) {
            $table->id('consultation_id');
            $table->foreignId('faculty_id')->constrained('faculty', 'faculty_id')->cascadeOnDelete();
            $table->unsignedBigInteger('student_id');
            $table->string('student_name')->nullable();

            $table->date('consultation_date');
            $table->time('consultation_time');
            $table->string('status')->default('pending');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultations');
    }
};
