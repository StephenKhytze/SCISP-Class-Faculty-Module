<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Same soft-archive pattern already used for schedules and class_sections: hide a subject
// from the catalog without deleting it (and whatever schedule history still points at it).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable()->after('strand');
        });
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn('archived_at');
        });
    }
};
