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
        Schema::table('recetas', function (Blueprint $table) {
            $table->boolean('is_blocked')->default(false)->after('categoria');
            $table->string('block_reason')->nullable()->after('is_blocked');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recetas', function (Blueprint $table) {
            $table->dropColumn('is_blocked');
            $table->dropColumn('block_reason');
        });
    }
};
