<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameReplaySnapshot extends Model
{
    public $timestamps = false;

    protected $fillable = ['game_id', 'world_tick', 'state_json'];

    protected $casts = [
        'created_at' => 'datetime',
        'world_tick' => 'integer',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    /**
     * Decode the base64-gzip-encoded JSON state.
     * Falls back gracefully for plain JSON (legacy rows) and raw gzip (pre-migration rows).
     *
     * @return array<string, mixed>
     */
    public function decodeState(): array
    {
        $raw = is_resource($this->state_json)
            ? stream_get_contents($this->state_json)
            : (string) $this->state_json;

        // Current format: base64(gzip(json))
        $decoded = base64_decode($raw, strict: true);
        if ($decoded !== false) {
            $decompressed = @gzdecode($decoded);
            if ($decompressed !== false) {
                return json_decode($decompressed, true) ?? [];
            }
        }

        // Legacy: raw gzip binary
        $decompressed = @gzdecode($raw);
        if ($decompressed !== false) {
            return json_decode($decompressed, true) ?? [];
        }

        // Legacy: plain JSON
        return json_decode($raw, true) ?? [];
    }

    /**
     * Encode state as base64(gzip(json)) — text-safe for PostgreSQL text columns.
     *
     * @param  array<string, mixed>  $state
     */
    public static function encodeState(array $state): string
    {
        $json = json_encode($state) ?: '{}';
        $compressed = gzencode($json);

        return $compressed !== false ? base64_encode($compressed) : base64_encode($json);
    }
}
