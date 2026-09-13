<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('producer')->nullable();
            $table->unsignedSmallInteger('vintage')->nullable();
            $table->string('type', 20);
            $table->string('country')->nullable();
            $table->string('region')->nullable();
            $table->decimal('alcohol', 4, 1)->nullable();
            $table->string('body', 10)->nullable();
            $table->text('notes')->nullable();
            $table->string('label_path')->nullable();
            $table->timestamps();
        });
        Schema::create('grapes', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });
        Schema::create('grape_wine', function (Blueprint $table) {
            $table->foreignId('grape_id')->constrained()->cascadeOnDelete();
            $table->foreignId('wine_id')->constrained()->cascadeOnDelete();
            $table->primary(['grape_id', 'wine_id']);
        });
        Schema::create('wine_racks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedTinyInteger('rows');
            $table->unsignedTinyInteger('columns');
            $table->timestamps();
        });
        Schema::create('bottles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wine_id')->constrained()->cascadeOnDelete();
            $table->foreignId('wine_rack_id')->nullable()->constrained()->restrictOnDelete();
            $table->unsignedTinyInteger('row')->nullable();
            $table->unsignedTinyInteger('column')->nullable();
            $table->string('status', 12)->default('available');
            $table->timestamps();
            $table->unique(['wine_rack_id', 'row', 'column'], 'bottles_unique_position');
            $table->index(['wine_id', 'status']);
        });
        Schema::create('bottle_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('bottle_id')->constrained()->cascadeOnDelete();
            $table->string('type', 12);
            $table->string('from_location')->nullable();
            $table->string('to_location')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bottle_events');
        Schema::dropIfExists('bottles');
        Schema::dropIfExists('wine_racks');
        Schema::dropIfExists('grape_wine');
        Schema::dropIfExists('grapes');
        Schema::dropIfExists('wines');
    }
};
