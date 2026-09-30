<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id('leave_request_id');
            $table->foreignId('faculty_id')->constrained('faculty', 'faculty_id')->cascadeOnDelete();

            $table->date('start_date');
            $table->date('end_date');
            $table->text('reason');

            $table->string('status')->default('pending');
            $table->text('admin_remarks')->nullable();
            $table->timestamp('reviewed_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};
