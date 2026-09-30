<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Additive on top of teaching_levels (Elementary/Junior High School/Senior High School):
// a Basic Ed teacher is usually a self-contained classroom teacher for ONE specific grade,
// not every grade within their level, so "Elementary" alone isn't precise enough to keep a
// Grade 1 teacher out of a Grade 4 section's Faculty dropdown. Nullable/empty means "not
// narrowed down yet" - same permissive-fallback behavior as teaching_levels.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('faculty', function (Blueprint $table) {
            $table->json('teaching_grades')->nullable()->after('teaching_levels');
        });
    }

    public function down(): void
    {
        Schema::table('faculty', function (Blueprint $table) {
            $table->dropColumn('teaching_grades');
        });
    }
};
