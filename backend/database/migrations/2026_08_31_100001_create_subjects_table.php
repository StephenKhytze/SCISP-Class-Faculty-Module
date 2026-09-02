<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subjects', function (Blueprint $table) {
            $table->id('subject_id');
            $table->string('subject_code')->unique();
            $table->string('subject_name');
            $table->text('description')->nullable();
            $table->string('category');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subjects');
    }
};
