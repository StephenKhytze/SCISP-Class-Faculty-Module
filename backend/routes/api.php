<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Home\DashboardController;
use App\Http\Controllers\Schedule\ScheduleController;
use App\Http\Controllers\Announcements\AnnouncementController;
use App\Http\Controllers\Library\LibraryController;
use App\Http\Controllers\StudentInfo\StudentController;
use App\Http\Controllers\Faculty\FacultyController;
use App\Http\Controllers\Faculty\ConsultationController;

Route::get('/test', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'API is working properly!'
    ]);
});

/*
|--------------------------------------------------------------------------
| Group 1: Auth & Home
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    // Group 1: Add more auth routes here
});

Route::middleware('auth.jwt')->group(function () {
    Route::prefix('home')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        // Group 1: Add more home routes here
    });

    /*
    |--------------------------------------------------------------------------
    | Group 2: Schedule
    |--------------------------------------------------------------------------
    */
    Route::prefix('schedule')->group(function () {
        Route::get('/', [ScheduleController::class, 'index']);
        Route::post('/', [ScheduleController::class, 'store']);
        Route::put('/{schedule}', [ScheduleController::class, 'update']);
        Route::patch('/{schedule}/archive', [ScheduleController::class, 'archive']);
        Route::patch('/{schedule}/restore', [ScheduleController::class, 'restore']);
        // Group 2: Add more schedule routes here
    });

    /*
    |--------------------------------------------------------------------------
    | Group 3: Announcements
    |--------------------------------------------------------------------------
    */
    Route::prefix('announcements')->group(function () {
        Route::get('/', [AnnouncementController::class, 'index']);
        // Group 3: Add more announcement routes here
    });

    /*
    |--------------------------------------------------------------------------
    | Group 4: Library
    |--------------------------------------------------------------------------
    */
    Route::prefix('library')->group(function () {
        Route::get('/', [LibraryController::class, 'index']);
        // Group 4: Add more library routes here
    });

    /*
    |--------------------------------------------------------------------------
    | Group 5: Student Info & Faculty Directory
    |--------------------------------------------------------------------------
    */
    Route::prefix('student-info')->group(function () {
        Route::get('/', [StudentController::class, 'index']);
        // Group 5: Add more student info routes here
    });

    Route::prefix('faculty')->group(function () {
        Route::get('/', [FacultyController::class, 'index']);
        Route::post('/', [FacultyController::class, 'store']);
        Route::get('/me', [FacultyController::class, 'me']);
        Route::get('/{faculty}', [FacultyController::class, 'show']);
        Route::put('/{faculty}', [FacultyController::class, 'update']);
        Route::get('/{faculty}/consultations', [ConsultationController::class, 'index']);
        Route::post('/{faculty}/consultations', [ConsultationController::class, 'store']);
        // Group 5: Add more faculty routes here
    });

    Route::get('/consultations', [ConsultationController::class, 'all']);
    Route::get('/consultations/me', [ConsultationController::class, 'mine']);
    Route::patch('/consultations/{consultation}', [ConsultationController::class, 'updateStatus']);
});
