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
        Schema::table('meal_plans', function (Blueprint $table) {
            $table->enum('estilo_comida', ['vegana', 'vegetariana', 'gimnasio', 'perdida_peso', 'mixta'])->default('mixta')->after('descripcion');
            $table->json('ingredientes_incluir')->nullable()->after('estilo_comida');
            $table->json('ingredientes_excluir')->nullable()->after('ingredientes_incluir');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('meal_plans', function (Blueprint $table) {
            $table->dropColumn(['estilo_comida', 'ingredientes_incluir', 'ingredientes_excluir']);
        });
    }
};
