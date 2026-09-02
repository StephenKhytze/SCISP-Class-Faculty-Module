<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faculty_availability', function (Blueprint $table) {
            $table->id('availability_id');
            $table->foreignId('faculty_id')->constrained('faculty', 'faculty_id')->cascadeOnDelete();
            $table->string('day');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('status');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faculty_availability');
    }
};
