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
        Schema::create('recetas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('titulo');
            $table->text('descripcion');
            $table->string('imagen_url');
            $table->string('tiempo_preparacion')->nullable(); // ej: "45 min"
            $table->integer('porciones')->default(1);
            $table->enum('dificultad', ['Fácil', 'Media', 'Difícil'])->default('Fácil');
            $table->json('ingredientes')->nullable(); // array JSON
            $table->json('pasos')->nullable(); // array JSON
            $table->string('categoria')->nullable();
            $table->integer('likes_count')->default(0);
            $table->integer('comentarios_count')->default(0);
            $table->timestamps();

            // Relación con usuarios
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recetas');
    }
};
