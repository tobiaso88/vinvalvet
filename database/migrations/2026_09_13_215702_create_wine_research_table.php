<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('wine_researches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wine_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('status', 20)->index();
            $table->json('input_snapshot')->nullable();
            $table->json('suggestions')->nullable();
            $table->json('ratings')->nullable();
            $table->json('sources')->nullable();
            $table->json('warnings')->nullable();
            $table->json('applied_fields')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('researched_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wine_researches');
    }
};
