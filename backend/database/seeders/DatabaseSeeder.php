<?php

namespace Database\Seeders;

use App\Models\Faculty;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'username' => 'DelaCruz_Juan_C1234',
            'password' => \Illuminate\Support\Facades\Hash::make('secretpassword123'),
            'role' => 'student',
            'status' => 'active',
        ]);

        User::factory()->create([
            'username' => 'Admin_User_00001',
            'password' => \Illuminate\Support\Facades\Hash::make('secretpassword123'),
            'role' => 'administrator',
            'status' => 'active',
        ]);

        $faculties = [
            [
                'first_name' => 'Dr. Alejandro',
                'last_name' => 'Reyes',
                'position' => 'Dean & Full Professor',
                'department' => 'Computer Science',
                'college' => 'College of Computer Studies',
                'building' => 'CCS Building',
                'room' => 'Room 501',
                'local_ext' => '8101',
                'email_address' => 'a.reyes@abcschool.edu.ph',
                'office_hours' => 'Mon & Wed 2:00 PM - 5:00 PM',
                'specializations' => ['Artificial Intelligence', 'Algorithms', 'Distributed Systems'],
                'availability_status' => 'available',
                'status_detail' => 'In Office',
            ],
            [
                'first_name' => 'Prof. Maria',
                'last_name' => 'Santos',
                'position' => 'Department Chair & Associate Professor',
                'department' => 'Information Technology',
                'college' => 'College of Computer Studies',
                'building' => 'CCS Building',
                'room' => 'Room 402',
                'local_ext' => '8104',
                'email_address' => 'm.santos@abcschool.edu.ph',
                'office_hours' => 'Tue & Thu 1:00 PM - 4:00 PM',
                'specializations' => ['Database Management', 'Web Engineering', 'System Security'],
                'availability_status' => 'in_class',
                'status_detail' => 'Lecture',
            ],
            [
                'first_name' => 'Engr. Julius',
                'last_name' => 'Robles',
                'position' => 'Assistant Professor II',
                'department' => 'Information Technology',
                'college' => 'College of Computer Studies',
                'building' => 'Tech Building',
                'room' => 'Room 321',
                'local_ext' => '8210',
                'email_address' => 'j.robles@abcschool.edu.ph',
                'office_hours' => 'Mon & Fri 10:00 AM - 12:00 PM',
                'specializations' => ['Integrative Programming', 'React & Node.js', 'API Design'],
                'availability_status' => 'available',
                'status_detail' => 'In Office',
            ],
            [
                'first_name' => 'Dr. Camille',
                'last_name' => 'Ortega',
                'position' => 'Associate Professor',
                'department' => 'Computer Science',
                'college' => 'College of Computer Studies',
                'building' => 'CCS Building',
                'room' => 'Room 210',
                'local_ext' => '8115',
                'email_address' => 'c.ortega@abcschool.edu.ph',
                'office_hours' => 'Wed & Fri 3:00 PM - 5:00 PM',
                'specializations' => ['Data Structures', 'Machine Learning'],
                'availability_status' => 'consultation_hours',
                'status_detail' => 'By Appointment',
            ],
            [
                'first_name' => 'Prof. Ramon',
                'last_name' => 'Villanueva',
                'position' => 'Assistant Professor I',
                'department' => 'Information Systems',
                'college' => 'College of Computer Studies',
                'building' => 'IS Building',
                'room' => 'Room 115',
                'local_ext' => '8305',
                'email_address' => 'r.villanueva@abcschool.edu.ph',
                'office_hours' => 'Tue & Thu 9:00 AM - 11:00 AM',
                'specializations' => ['Systems Analysis', 'Project Management'],
                'availability_status' => 'off_campus',
                'status_detail' => 'Field Work',
            ],
            [
                'first_name' => 'Ms. Bianca',
                'last_name' => 'Fernandez',
                'position' => 'Instructor I',
                'department' => 'General Education',
                'college' => 'College of Arts and Sciences',
                'building' => 'GE Building',
                'room' => 'Room 108',
                'local_ext' => '8402',
                'email_address' => 'b.fernandez@abcschool.edu.ph',
                'office_hours' => 'Mon, Wed & Fri 1:00 PM - 2:00 PM',
                'specializations' => ['Technical Writing', 'Communication Arts'],
                'availability_status' => 'available',
                'status_detail' => 'In Office',
            ],
        ];

        foreach ($faculties as $faculty) {
            Faculty::create($faculty);
        }

        $facultyIdByEmail = Faculty::all()->pluck('faculty_id', 'email_address');

        $subjects = [
            ['subject_code' => 'IPT 2', 'subject_name' => 'Integrative Programming & Technologies 2', 'category' => 'Major'],
            ['subject_code' => 'WEBDEV 2', 'subject_name' => 'Web Systems and Technologies 2', 'category' => 'Major'],
            ['subject_code' => 'ALGO 1', 'subject_name' => 'Algorithms and Complexity', 'category' => 'Major'],
            ['subject_code' => 'SYSAN 1', 'subject_name' => 'Systems Analysis and Design', 'category' => 'Major'],
            ['subject_code' => 'DSTRUCT 2', 'subject_name' => 'Data Structures and Algorithms', 'category' => 'Major'],
            ['subject_code' => 'TECHWRIT', 'subject_name' => 'Technical Writing', 'category' => 'General Education'],
            ['subject_code' => 'NETSEC 1', 'subject_name' => 'Network Security Fundamentals', 'category' => 'Major'],
            ['subject_code' => 'CS-DS 1', 'subject_name' => 'Discrete Structures', 'category' => 'Major'],
            ['subject_code' => 'IS-PM 1', 'subject_name' => 'IT Project Management', 'category' => 'Major'],
        ];

        foreach ($subjects as $subject) {
            Subject::create($subject);
        }

        $subjectIdByCode = Subject::all()->pluck('subject_id', 'subject_code');

        $schedules = [
            ['subject_code' => 'IPT 2', 'room' => 'Rm 321', 'day' => 'Monday', 'start_time' => '07:00', 'end_time' => '09:00', 'level' => 'BSIT', 'year' => '3rd Year', 'section' => 'A', 'faculty_email' => 'j.robles@abcschool.edu.ph'],
            ['subject_code' => 'WEBDEV 2', 'room' => 'Rm 402', 'day' => 'Monday', 'start_time' => '09:00', 'end_time' => '11:00', 'level' => 'BSIT', 'year' => '3rd Year', 'section' => 'A', 'faculty_email' => 'm.santos@abcschool.edu.ph'],
            ['subject_code' => 'ALGO 1', 'room' => 'Rm 501', 'day' => 'Tuesday', 'start_time' => '09:00', 'end_time' => '11:00', 'level' => 'BSIT', 'year' => '3rd Year', 'section' => 'A', 'faculty_email' => 'a.reyes@abcschool.edu.ph'],
            ['subject_code' => 'SYSAN 1', 'room' => 'Rm 115', 'day' => 'Tuesday', 'start_time' => '13:00', 'end_time' => '15:00', 'level' => 'BSIT', 'year' => '3rd Year', 'section' => 'A', 'faculty_email' => 'r.villanueva@abcschool.edu.ph'],
            ['subject_code' => 'DSTRUCT 2', 'room' => 'Rm 210', 'day' => 'Wednesday', 'start_time' => '07:00', 'end_time' => '09:00', 'level' => 'BSIT', 'year' => '3rd Year', 'section' => 'A', 'faculty_email' => 'c.ortega@abcschool.edu.ph'],
            ['subject_code' => 'IPT 2', 'room' => 'Rm 321', 'day' => 'Wednesday', 'start_time' => '11:00', 'end_time' => '13:00', 'level' => 'BSIT', 'year' => '3rd Year', 'section' => 'A', 'faculty_email' => 'j.robles@abcschool.edu.ph'],
            ['subject_code' => 'TECHWRIT', 'room' => 'Rm 108', 'day' => 'Thursday', 'start_time' => '13:00', 'end_time' => '15:00', 'level' => 'BSIT', 'year' => '3rd Year', 'section' => 'A', 'faculty_email' => 'b.fernandez@abcschool.edu.ph'],
            ['subject_code' => 'WEBDEV 2', 'room' => 'Rm 402', 'day' => 'Friday', 'start_time' => '09:00', 'end_time' => '11:00', 'level' => 'BSIT', 'year' => '3rd Year', 'section' => 'A', 'faculty_email' => 'm.santos@abcschool.edu.ph'],
            ['subject_code' => 'ALGO 1', 'room' => 'Rm 501', 'day' => 'Friday', 'start_time' => '15:00', 'end_time' => '17:00', 'level' => 'BSIT', 'year' => '3rd Year', 'section' => 'A', 'faculty_email' => 'a.reyes@abcschool.edu.ph'],
            ['subject_code' => 'NETSEC 1', 'room' => 'Rm 402', 'day' => 'Monday', 'start_time' => '09:00', 'end_time' => '11:00', 'level' => 'BSIT', 'year' => '2nd Year', 'section' => 'B', 'faculty_email' => 'm.santos@abcschool.edu.ph'],
            ['subject_code' => 'CS-DS 1', 'room' => 'Rm 210', 'day' => 'Tuesday', 'start_time' => '07:00', 'end_time' => '09:00', 'level' => 'BSCS', 'year' => '2nd Year', 'section' => 'A', 'faculty_email' => 'c.ortega@abcschool.edu.ph'],
            ['subject_code' => 'IS-PM 1', 'room' => 'Rm 115', 'day' => 'Thursday', 'start_time' => '09:00', 'end_time' => '11:00', 'level' => 'BSIS', 'year' => '4th Year', 'section' => 'A', 'faculty_email' => 'r.villanueva@abcschool.edu.ph'],
        ];

        foreach ($schedules as $schedule) {
            Schedule::create([
                'subject_id' => $subjectIdByCode[$schedule['subject_code']],
                'faculty_id' => $facultyIdByEmail[$schedule['faculty_email']],
                'room' => $schedule['room'],
                'level' => $schedule['level'],
                'year' => $schedule['year'],
                'section' => $schedule['section'],
                'day' => $schedule['day'],
                'start_time' => $schedule['start_time'],
                'end_time' => $schedule['end_time'],
            ]);
        }
    }
}
