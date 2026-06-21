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
        Schema::table('maps', function (Blueprint $table) {
            $table->boolean('is_geo_map')->default(false)->after('published_at');
            $table->index(['is_geo_map', 'published']);
        });
    }

    public function down(): void
    {
        Schema::table('maps', function (Blueprint $table) {
            $table->dropIndex(['is_geo_map', 'published']);
            $table->dropColumn('is_geo_map');
        });
    }
};
