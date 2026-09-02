<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faculty_consultation_hours', function (Blueprint $table) {
            $table->id('consult_id');
            $table->foreignId('faculty_id')->constrained('faculty', 'faculty_id')->cascadeOnDelete();
            $table->string('day');
            $table->time('time');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faculty_consultation_hours');
    }
};
