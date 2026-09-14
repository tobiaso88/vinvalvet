<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('wines', function (Blueprint $table) {
            $table->decimal('estimated_value', 10, 2)->nullable();
        });

        Schema::create('wine_valuations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wine_id')->unique()->constrained()->cascadeOnDelete();
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

        DB::table('wines')->orderBy('id')->each(function (object $wine): void {
            $valuation = DB::table('bottle_valuations')
                ->join('bottles', 'bottles.id', '=', 'bottle_valuations.bottle_id')
                ->where('bottles.wine_id', $wine->id)
                ->select('bottle_valuations.*')
                ->orderByDesc('bottle_valuations.reviewed_at')
                ->orderByDesc('bottle_valuations.valued_at')
                ->orderByDesc('bottle_valuations.id')
                ->first();

            if ($valuation) {
                DB::table('wine_valuations')->insert([
                    'wine_id' => $wine->id,
                    'status' => $valuation->status,
                    'input_snapshot' => $valuation->input_snapshot,
                    'estimated_value' => $valuation->estimated_value,
                    'currency' => $valuation->currency,
                    'basis' => $valuation->basis,
                    'sources' => $valuation->sources,
                    'warnings' => $valuation->warnings,
                    'error_message' => $valuation->error_message,
                    'valued_at' => $valuation->valued_at,
                    'reviewed_at' => $valuation->reviewed_at,
                    'created_at' => $valuation->created_at,
                    'updated_at' => $valuation->updated_at,
                ]);
            }

            $estimatedValue = DB::table('bottles')
                ->where('wine_id', $wine->id)
                ->whereNotNull('estimated_value')
                ->orderByDesc('updated_at')
                ->orderByDesc('id')
                ->value('estimated_value');
            $estimatedValue ??= $valuation?->reviewed_at ? $valuation->estimated_value : null;

            if ($estimatedValue !== null) {
                DB::table('wines')->where('id', $wine->id)->update(['estimated_value' => $estimatedValue]);
            }
        });

        Schema::dropIfExists('bottle_valuations');

        Schema::table('bottles', function (Blueprint $table) {
            $table->dropColumn('estimated_value');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bottles', function (Blueprint $table) {
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

        DB::table('wines')->orderBy('id')->each(function (object $wine): void {
            DB::table('bottles')->where('wine_id', $wine->id)->update(['estimated_value' => $wine->estimated_value]);
            $valuation = DB::table('wine_valuations')->where('wine_id', $wine->id)->first();

            if (! $valuation) {
                return;
            }

            DB::table('bottles')->where('wine_id', $wine->id)->orderBy('id')->each(function (object $bottle) use ($valuation): void {
                DB::table('bottle_valuations')->insert([
                    'bottle_id' => $bottle->id,
                    'status' => $valuation->status,
                    'input_snapshot' => $valuation->input_snapshot,
                    'estimated_value' => $valuation->estimated_value,
                    'currency' => $valuation->currency,
                    'basis' => $valuation->basis,
                    'sources' => $valuation->sources,
                    'warnings' => $valuation->warnings,
                    'error_message' => $valuation->error_message,
                    'valued_at' => $valuation->valued_at,
                    'reviewed_at' => $valuation->reviewed_at,
                    'created_at' => $valuation->created_at,
                    'updated_at' => $valuation->updated_at,
                ]);
            });
        });

        Schema::dropIfExists('wine_valuations');

        Schema::table('wines', function (Blueprint $table) {
            $table->dropColumn('estimated_value');
        });
    }
};
