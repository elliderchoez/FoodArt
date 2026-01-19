<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('comment_banned_until')->nullable()->after('block_reason');
            $table->string('comment_ban_reason', 255)->nullable()->after('comment_banned_until');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['comment_banned_until', 'comment_ban_reason']);
        });
    }
};
