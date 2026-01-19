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
        Schema::create('meal_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->date('fecha_inicio');
            $table->date('fecha_fin')->nullable();
            $table->enum('estado', ['activo', 'pausado', 'completado'])->default('activo');
            $table->timestamps();
            $table->index('user_id');
            $table->index('fecha_inicio');
        });

        Schema::create('meal_plan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meal_plan_id')->constrained('meal_plans')->onDelete('cascade');
            $table->foreignId('receta_id')->constrained('recetas')->onDelete('cascade');
            $table->enum('dia', ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']);
            $table->enum('comida', ['desayuno', 'almuerzo', 'merienda', 'cena'])->default('almuerzo');
            $table->integer('porciones')->default(1);
            $table->timestamps();
            $table->unique(['meal_plan_id', 'dia', 'comida']);
            $table->index('meal_plan_id');
            $table->index('receta_id');
        });

        Schema::create('shopping_lists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('meal_plan_id')->nullable()->constrained('meal_plans')->onDelete('set null');
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->enum('estado', ['pendiente', 'en_progreso', 'completada'])->default('pendiente');
            $table->date('fecha_objetivo')->nullable();
            $table->timestamps();
            $table->index('user_id');
            $table->index('meal_plan_id');
        });

        Schema::create('shopping_list_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shopping_list_id')->constrained('shopping_lists')->onDelete('cascade');
            $table->string('ingrediente');
            $table->decimal('cantidad', 8, 2);
            $table->string('unidad')->default('unidad'); // kg, litros, unidades, cucharadas, etc
            $table->decimal('precio_estimado', 8, 2)->nullable();
            $table->boolean('comprado')->default(false);
            $table->timestamp('comprado_at')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();
            $table->index('shopping_list_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shopping_list_items');
        Schema::dropIfExists('shopping_lists');
        Schema::dropIfExists('meal_plan_items');
        Schema::dropIfExists('meal_plans');
    }
};
