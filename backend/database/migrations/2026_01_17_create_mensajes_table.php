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
        Schema::create('mensajes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('remitente_id');
            $table->unsignedBigInteger('destinatario_id');
            $table->text('contenido');
            $table->boolean('leido')->default(false);
            $table->timestamp('leido_at')->nullable();
            $table->timestamps();

            $table->foreign('remitente_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('destinatario_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['remitente_id', 'destinatario_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mensajes');
    }
};
