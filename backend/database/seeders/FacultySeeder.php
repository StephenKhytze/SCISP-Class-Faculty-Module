<?php

namespace Database\Seeders;

use App\Models\Faculty;
use Illuminate\Database\Seeder;

class FacultySeeder extends Seeder
{
    public function run(): void
    {
        $faculties = [
            [
                'name' => 'Dr. Alejandro Reyes',
                'position' => 'Dean & Full Professor',
                'department' => 'Computer Science',
                'college' => 'College of Computer Studies',
                'building' => 'CCS Building',
                'room' => 'Room 501',
                'local_ext' => '8101',
                'email' => 'a.reyes@abcschool.edu.ph',
                'office_hours' => 'Mon & Wed 2:00 PM - 5:00 PM',
                'specializations' => ['Artificial Intelligence', 'Algorithms', 'Distributed Systems'],
                'availability_status' => 'available',
                'status_detail' => 'In Office',
            ],
            [
                'name' => 'Prof. Maria Santos',
                'position' => 'Department Chair & Associate Professor',
                'department' => 'Information Technology',
                'college' => 'College of Computer Studies',
                'building' => 'CCS Building',
                'room' => 'Room 402',
                'local_ext' => '8104',
                'email' => 'm.santos@abcschool.edu.ph',
                'office_hours' => 'Tue & Thu 1:00 PM - 4:00 PM',
                'specializations' => ['Database Management', 'Web Engineering', 'System Security'],
                'availability_status' => 'in_class',
                'status_detail' => 'Lecture',
            ],
            [
                'name' => 'Engr. Julius Robles',
                'position' => 'Assistant Professor II',
                'department' => 'Information Technology',
                'college' => 'College of Computer Studies',
                'building' => 'Tech Building',
                'room' => 'Room 321',
                'local_ext' => '8210',
                'email' => 'j.robles@abcschool.edu.ph',
                'office_hours' => 'Mon & Fri 10:00 AM - 12:00 PM',
                'specializations' => ['Integrative Programming', 'React & Node.js', 'API Design'],
                'availability_status' => 'available',
                'status_detail' => 'In Office',
            ],
            [
                'name' => 'Dr. Camille Ortega',
                'position' => 'Associate Professor',
                'department' => 'Computer Science',
                'college' => 'College of Computer Studies',
                'building' => 'CCS Building',
                'room' => 'Room 210',
                'local_ext' => '8115',
                'email' => 'c.ortega@abcschool.edu.ph',
                'office_hours' => 'Wed & Fri 3:00 PM - 5:00 PM',
                'specializations' => ['Data Structures', 'Machine Learning'],
                'availability_status' => 'consultation_hours',
                'status_detail' => 'By Appointment',
            ],
            [
                'name' => 'Prof. Ramon Villanueva',
                'position' => 'Assistant Professor I',
                'department' => 'Information Systems',
                'college' => 'College of Computer Studies',
                'building' => 'IS Building',
                'room' => 'Room 115',
                'local_ext' => '8305',
                'email' => 'r.villanueva@abcschool.edu.ph',
                'office_hours' => 'Tue & Thu 9:00 AM - 11:00 AM',
                'specializations' => ['Systems Analysis', 'Project Management'],
                'availability_status' => 'off_campus',
                'status_detail' => 'Field Work',
            ],
            [
                'name' => 'Ms. Bianca Fernandez',
                'position' => 'Instructor I',
                'department' => 'General Education',
                'college' => 'College of Arts and Sciences',
                'building' => 'GE Building',
                'room' => 'Room 108',
                'local_ext' => '8402',
                'email' => 'b.fernandez@abcschool.edu.ph',
                'office_hours' => 'Mon, Wed & Fri 1:00 PM - 2:00 PM',
                'specializations' => ['Technical Writing', 'Communication Arts'],
                'availability_status' => 'available',
                'status_detail' => 'In Office',
            ],
        ];

        foreach ($faculties as $faculty) {
            Faculty::create($faculty);
        }
    }
}
