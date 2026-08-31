<?php

namespace Database\Seeders;

use App\Models\ClassSchedule;
use App\Models\Faculty;
use Illuminate\Database\Seeder;

class ScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $facultyIdByName = Faculty::all()->pluck('id', 'name');

        $schedules = [
            ['subject_code' => 'IPT 2', 'subject_name' => 'Integrative Programming & Technologies 2', 'room' => 'Rm 321', 'day_of_week' => 'Monday', 'start_time' => '07:00', 'end_time' => '09:00', 'course' => 'BSIT', 'year_level' => '3rd Year', 'semester' => '1st Semester', 'faculty' => 'Engr. Julius Robles'],
            ['subject_code' => 'WEBDEV 2', 'subject_name' => 'Web Systems and Technologies 2', 'room' => 'Rm 402', 'day_of_week' => 'Monday', 'start_time' => '09:00', 'end_time' => '11:00', 'course' => 'BSIT', 'year_level' => '3rd Year', 'semester' => '1st Semester', 'faculty' => 'Prof. Maria Santos'],
            ['subject_code' => 'ALGO 1', 'subject_name' => 'Algorithms and Complexity', 'room' => 'Rm 501', 'day_of_week' => 'Tuesday', 'start_time' => '09:00', 'end_time' => '11:00', 'course' => 'BSIT', 'year_level' => '3rd Year', 'semester' => '1st Semester', 'faculty' => 'Dr. Alejandro Reyes'],
            ['subject_code' => 'SYSAN 1', 'subject_name' => 'Systems Analysis and Design', 'room' => 'Rm 115', 'day_of_week' => 'Tuesday', 'start_time' => '13:00', 'end_time' => '15:00', 'course' => 'BSIT', 'year_level' => '3rd Year', 'semester' => '1st Semester', 'faculty' => 'Prof. Ramon Villanueva'],
            ['subject_code' => 'DSTRUCT 2', 'subject_name' => 'Data Structures and Algorithms', 'room' => 'Rm 210', 'day_of_week' => 'Wednesday', 'start_time' => '07:00', 'end_time' => '09:00', 'course' => 'BSIT', 'year_level' => '3rd Year', 'semester' => '1st Semester', 'faculty' => 'Dr. Camille Ortega'],
            ['subject_code' => 'IPT 2', 'subject_name' => 'Integrative Programming & Technologies 2', 'room' => 'Rm 321', 'day_of_week' => 'Wednesday', 'start_time' => '11:00', 'end_time' => '13:00', 'course' => 'BSIT', 'year_level' => '3rd Year', 'semester' => '1st Semester', 'faculty' => 'Engr. Julius Robles'],
            ['subject_code' => 'TECHWRIT', 'subject_name' => 'Technical Writing', 'room' => 'Rm 108', 'day_of_week' => 'Thursday', 'start_time' => '13:00', 'end_time' => '15:00', 'course' => 'BSIT', 'year_level' => '3rd Year', 'semester' => '1st Semester', 'faculty' => 'Ms. Bianca Fernandez'],
            ['subject_code' => 'WEBDEV 2', 'subject_name' => 'Web Systems and Technologies 2', 'room' => 'Rm 402', 'day_of_week' => 'Friday', 'start_time' => '09:00', 'end_time' => '11:00', 'course' => 'BSIT', 'year_level' => '3rd Year', 'semester' => '1st Semester', 'faculty' => 'Prof. Maria Santos'],
            ['subject_code' => 'ALGO 1', 'subject_name' => 'Algorithms and Complexity', 'room' => 'Rm 501', 'day_of_week' => 'Friday', 'start_time' => '15:00', 'end_time' => '17:00', 'course' => 'BSIT', 'year_level' => '3rd Year', 'semester' => '1st Semester', 'faculty' => 'Dr. Alejandro Reyes'],

            ['subject_code' => 'NETSEC 1', 'subject_name' => 'Network Security Fundamentals', 'room' => 'Rm 402', 'day_of_week' => 'Monday', 'start_time' => '09:00', 'end_time' => '11:00', 'course' => 'BSIT', 'year_level' => '2nd Year', 'semester' => '1st Semester', 'faculty' => 'Prof. Maria Santos'],
            ['subject_code' => 'CS-DS 1', 'subject_name' => 'Discrete Structures', 'room' => 'Rm 210', 'day_of_week' => 'Tuesday', 'start_time' => '07:00', 'end_time' => '09:00', 'course' => 'BSCS', 'year_level' => '2nd Year', 'semester' => '1st Semester', 'faculty' => 'Dr. Camille Ortega'],
            ['subject_code' => 'IS-PM 1', 'subject_name' => 'IT Project Management', 'room' => 'Rm 115', 'day_of_week' => 'Thursday', 'start_time' => '09:00', 'end_time' => '11:00', 'course' => 'BSIS', 'year_level' => '4th Year', 'semester' => '1st Semester', 'faculty' => 'Prof. Ramon Villanueva'],
        ];

        foreach ($schedules as $schedule) {
            ClassSchedule::create([
                'subject_code' => $schedule['subject_code'],
                'subject_name' => $schedule['subject_name'],
                'room' => $schedule['room'],
                'day_of_week' => $schedule['day_of_week'],
                'start_time' => $schedule['start_time'],
                'end_time' => $schedule['end_time'],
                'course' => $schedule['course'],
                'year_level' => $schedule['year_level'],
                'semester' => $schedule['semester'],
                'faculty_id' => $facultyIdByName[$schedule['faculty']] ?? null,
            ]);
        }
    }
}
