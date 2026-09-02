<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faculty', function (Blueprint $table) {
            $table->id('faculty_id');
            $table->foreignId('user_id')->nullable()->constrained('users', 'user_id')->nullOnDelete();

            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('faculty_image')->nullable();
            $table->string('department');
            $table->string('email_address');

            $table->string('position');
            $table->string('college');
            $table->string('building');
            $table->string('room');
            $table->string('local_ext')->nullable();
            $table->string('office_hours')->nullable();
            $table->json('specializations')->nullable();
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
        Schema::dropIfExists('faculty');
    }
};
