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
        Schema::create('seguidor', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('usuario_id');
            $table->unsignedBigInteger('seguidor_id');
            $table->timestamps();

            // Foreign keys
            $table->foreign('usuario_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('seguidor_id')->references('id')->on('users')->onDelete('cascade');

            // Constraint para que no pueda haber duplicados
            $table->unique(['usuario_id', 'seguidor_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seguidor');
    }
};
