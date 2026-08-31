<?php

namespace Database\Seeders;

use App\Models\ConsultationBooking;
use App\Models\Faculty;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ConsultationBookingSeeder extends Seeder
{
    public function run(): void
    {
        $teacherUser = User::firstOrCreate(
            ['username' => 'Prof._Maria_Santos'],
            [
                'password' => Hash::make('secretpassword123'),
                'role' => 'faculty',
                'status' => 'active',
            ]
        );

        $faculty = Faculty::where('name', 'Prof. Maria Santos')->first();

        if ($faculty) {
            $faculty->update(['user_id' => $teacherUser->user_id]);

            $bookings = [
                ['student_name' => 'Juan Dela Cruz', 'booking_date' => '2026-08-06', 'start_time' => '13:00', 'end_time' => '13:30', 'status' => 'approved'],
                ['student_name' => 'Ana Gonzales', 'booking_date' => '2026-08-10', 'start_time' => '14:00', 'end_time' => '14:30', 'status' => 'approved'],
                ['student_name' => 'Carlos Mendoza', 'booking_date' => '2026-08-14', 'start_time' => '15:30', 'end_time' => '16:00', 'status' => 'approved'],
                ['student_name' => 'Bea Alonzo', 'booking_date' => '2026-08-18', 'start_time' => '13:30', 'end_time' => '14:00', 'status' => 'approved'],
                ['student_name' => 'David Tan', 'booking_date' => '2026-08-25', 'start_time' => '14:00', 'end_time' => '14:30', 'status' => 'completed'],
            ];

            foreach ($bookings as $booking) {
                ConsultationBooking::create([
                    'faculty_id' => $faculty->id,
                    'student_name' => $booking['student_name'],
                    'booking_date' => $booking['booking_date'],
                    'start_time' => $booking['start_time'],
                    'end_time' => $booking['end_time'],
                    'status' => $booking['status'],
                ]);
            }
        }
    }
}
