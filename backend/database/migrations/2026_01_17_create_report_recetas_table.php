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
        Schema::create('report_recetas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('receta_id');
            $table->unsignedBigInteger('usuario_id');
            $table->enum('reason', ['inapropiado', 'spam', 'falso', 'plagios', 'otro'])->default('otro');
            $table->text('description')->nullable();
            $table->enum('status', ['pendiente', 'revisado', 'rechazado', 'resuelto'])->default('pendiente');
            $table->text('admin_response')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->foreign('receta_id')->references('id')->on('recetas')->onDelete('cascade');
            $table->foreign('usuario_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_recetas');
    }
};
