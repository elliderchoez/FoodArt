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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('email_verified')->default(false)->after('email');
            $table->string('email_verification_token')->nullable()->after('email_verified');
            $table->string('password_reset_token')->nullable()->after('email_verification_token');
            $table->timestamp('password_reset_expires')->nullable()->after('password_reset_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['email_verified', 'email_verification_token', 'password_reset_token', 'password_reset_expires']);
        });
    }
};
