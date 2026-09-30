<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Nullable and additive: existing subjects keep working everywhere (global) until an
// admin explicitly assigns them to a course + year level via Manage Subjects.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->foreignId('course_id')->nullable()->after('category')->constrained('courses', 'course_id')->nullOnDelete();
            $table->string('year_label')->nullable()->after('course_id');
        });
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropConstrainedForeignId('course_id');
            $table->dropColumn('year_label');
        });
    }
};
