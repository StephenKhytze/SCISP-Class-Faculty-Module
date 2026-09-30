<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Closes the last scoping gap for Senior High: a subject was only ever scoped by
// course_id + year_label, which can't tell STEM's Grade 11 subjects apart from another
// strand's Grade 11 subjects sharing the same grade.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->string('strand')->nullable()->after('year_label');
        });
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn('strand');
        });
    }
};
