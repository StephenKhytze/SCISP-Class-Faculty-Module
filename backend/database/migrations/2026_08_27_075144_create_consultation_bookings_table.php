<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultation_bookings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('faculty_id')->constrained('faculties')->cascadeOnDelete();
            $table->string('student_name');
            $table->string('student_email')->nullable();

            $table->date('booking_date');
            $table->time('start_time');
            $table->time('end_time');

            $table->enum('status', ['pending', 'approved', 'declined', 'completed'])->default('pending');
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultation_bookings');
    }
};
