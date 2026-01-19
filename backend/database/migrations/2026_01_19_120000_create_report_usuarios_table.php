<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_usuarios', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('reported_user_id');
            $table->unsignedBigInteger('reporter_id');
            $table->enum('reason', ['inapropiado', 'spam', 'acoso', 'suplantacion', 'otro'])->default('otro');
            $table->text('description')->nullable();
            $table->enum('status', ['pendiente', 'revisado', 'rechazado', 'resuelto'])->default('pendiente');
            $table->text('admin_response')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->foreign('reported_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('reporter_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');

            $table->index(['reported_user_id', 'status']);
            $table->index(['reporter_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_usuarios');
    }
};
