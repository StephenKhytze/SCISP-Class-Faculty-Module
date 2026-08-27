<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faculties', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('position');
            $table->string('department');
            $table->string('college');

            $table->string('building');
            $table->string('room');
            $table->string('local_ext')->nullable();
            $table->string('email');
            $table->string('office_hours')->nullable();

            $table->json('specializations')->nullable();
            $table->string('photo_url')->nullable();

            $table->enum('availability_status', [
                'available',
                'in_class',
                'off_campus',
                'consultation_hours',
                'on_leave',
            ])->default('off_campus');

            $table->string('status_detail')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faculties');
    }
};
