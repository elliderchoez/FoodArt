<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Verificar si la columna tipo_dieta ya existe
        if (!Schema::hasColumn('recetas', 'tipo_dieta')) {
            Schema::table('recetas', function (Blueprint $table) {
                $table->enum('tipo_dieta', ['vegana', 'vegetariana', 'carnes', 'gym', 'mixta', 'bajar_peso'])
                      ->default('mixta')
                      ->after('pasos');
            });
        }
        
        // Ahora eliminar la columna categoria si existe
        if (Schema::hasColumn('recetas', 'categoria')) {
            DB::statement('ALTER TABLE recetas DROP COLUMN IF EXISTS categoria');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recetas', function (Blueprint $table) {
            if (Schema::hasColumn('recetas', 'tipo_dieta')) {
                $table->dropColumn('tipo_dieta');
            }
        });
        
        if (!Schema::hasColumn('recetas', 'categoria')) {
            Schema::table('recetas', function (Blueprint $table) {
                $table->string('categoria')->nullable();
            });
        }
    }
};