<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('game_players', function (Blueprint $table) {
            $table->dropUnique(['game_id', 'user_id']);
        });

        Schema::table('game_players', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('game_players', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->string('guest_key', 36)->nullable();
            $table->string('display_name', 60)->nullable();
            $table->unique(['game_id', 'user_id']);
            $table->unique(['game_id', 'guest_key']);
        });
    }

    public function down(): void
    {
        Schema::table('game_players', function (Blueprint $table) {
            $table->dropUnique(['game_id', 'guest_key']);
            $table->dropUnique(['game_id', 'user_id']);
        });

        Schema::table('game_players', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('game_players', function (Blueprint $table) {
            $table->dropColumn(['guest_key', 'display_name']);
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['game_id', 'user_id']);
        });
    }
};
