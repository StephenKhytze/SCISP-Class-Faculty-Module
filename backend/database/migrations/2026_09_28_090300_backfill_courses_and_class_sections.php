<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Populates the new reference tables from whatever already exists in `schedules`, so
// every course/year/section combo already visible in the app stays visible once the
// browse flow switches to reading from these tables instead of deriving them live.
return new class extends Migration
{
    private array $knownNames = [
        'BSIT' => 'Bachelor of Science in Information Technology (BSIT)',
        'BSCS' => 'Bachelor of Science in Computer Science (BSCS)',
        'BSIS' => 'Bachelor of Science in Information Systems (BSIS)',
        'BSBA' => 'Bachelor of Science in Business Administration (BSBA)',
        'BSED' => 'Bachelor of Secondary Education (BSED)',
        'MIT' => 'Master in Information Technology (MIT)',
        'MBA' => 'Master of Business Administration (MBA)',
        'MAEd' => 'Master of Arts in Education (MAEd)',
    ];

    public function up(): void
    {
        $rows = DB::table('schedules')->select('education_level', 'level', 'year', 'strand', 'section')->get();

        $courseIds = [];
        foreach ($rows as $row) {
            if (in_array($row->education_level, ['College', 'Masteral'], true) && $row->level) {
                $key = $row->education_level . '|' . $row->level;
                if (!isset($courseIds[$key])) {
                    $courseIds[$key] = DB::table('courses')->insertGetId([
                        'education_level' => $row->education_level,
                        'code' => $row->level,
                        'name' => $this->knownNames[$row->level] ?? $row->level,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        $seenSections = [];
        foreach ($rows as $row) {
            $isBasicEd = $row->education_level === 'Basic Ed';
            if ($isBasicEd) {
                if (!$row->level || !$row->year) continue;
                $key = implode('|', [$row->education_level, $row->level, $row->year, $row->strand, $row->section]);
                if (isset($seenSections[$key])) continue;
                $seenSections[$key] = true;

                DB::table('class_sections')->insert([
                    'education_level' => $row->education_level,
                    'course_id' => null,
                    'level_label' => $row->level,
                    'year_label' => $row->year,
                    'strand' => $row->strand,
                    'section_name' => $row->section,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                if (!$row->level || !$row->year) continue;
                $courseKey = $row->education_level . '|' . $row->level;
                $courseId = $courseIds[$courseKey] ?? null;
                if (!$courseId) continue;

                $key = implode('|', [$row->education_level, $row->level, $row->year, $row->section]);
                if (isset($seenSections[$key])) continue;
                $seenSections[$key] = true;

                DB::table('class_sections')->insert([
                    'education_level' => $row->education_level,
                    'course_id' => $courseId,
                    'level_label' => null,
                    'year_label' => $row->year,
                    'strand' => null,
                    'section_name' => $row->section,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('class_sections')->truncate();
        DB::table('courses')->truncate();
    }
};
