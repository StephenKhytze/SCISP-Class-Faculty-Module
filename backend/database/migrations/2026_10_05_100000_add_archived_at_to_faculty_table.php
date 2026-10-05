<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Soft archive for teachers, same pattern as rooms/subjects/sections. Schedules and
// history that point at a faculty row are kept; the row is only hidden from active lists.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('faculty', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable()->after('status_detail');
        });
    }

    public function down(): void
    {
        Schema::table('faculty', function (Blueprint $table) {
            $table->dropColumn('archived_at');
        });
    }
};
