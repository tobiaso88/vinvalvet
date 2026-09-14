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
        Schema::table('bottles', function (Blueprint $table) {
            $table->decimal('purchase_price', 10, 2)->nullable();
            $table->decimal('estimated_value', 10, 2)->nullable();
        });

        Schema::create('bottle_valuations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bottle_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('status', 20)->index();
            $table->json('input_snapshot')->nullable();
            $table->decimal('estimated_value', 10, 2)->nullable();
            $table->char('currency', 3)->default('SEK');
            $table->text('basis')->nullable();
            $table->json('sources')->nullable();
            $table->json('warnings')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('valued_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bottle_valuations');

        Schema::table('bottles', function (Blueprint $table) {
            $table->dropColumn(['purchase_price', 'estimated_value']);
        });
    }
};
