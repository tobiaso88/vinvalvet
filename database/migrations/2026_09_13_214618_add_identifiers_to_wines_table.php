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
        Schema::table('wines', function (Blueprint $table) {
            $table->string('ean', 14)->nullable()->after('region');
            $table->string('systembolaget_number', 20)->nullable()->after('ean');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wines', function (Blueprint $table) {
            $table->dropColumn(['ean', 'systembolaget_number']);
        });
    }
};
