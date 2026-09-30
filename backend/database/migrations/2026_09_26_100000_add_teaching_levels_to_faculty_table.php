<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('faculty', function (Blueprint $table) {
            $table->json('teaching_levels')->nullable()->after('specializations');
        });

        foreach (DB::table('faculty')->get() as $faculty) {
            $department = strtolower($faculty->department ?? '');

            $levels = match (true) {
                str_contains($department, 'senior high') => ['Senior High School'],
                str_contains($department, 'basic education') => ['Elementary', 'Junior High School'],
                default => ['College', 'Masteral'],
            };

            DB::table('faculty')
                ->where('faculty_id', $faculty->faculty_id)
                ->update(['teaching_levels' => json_encode($levels)]);
        }
    }

    public function down(): void
    {
        Schema::table('faculty', function (Blueprint $table) {
            $table->dropColumn('teaching_levels');
        });
    }
};
