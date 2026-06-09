<?php

namespace App\Games;

final class GameConstants
{
    public const int CELL_SIZE = 20;

    public const int WORLD_X = 1280;

    public const int WORLD_Y = 700;

    public const int ROWS = 64;

    public const int COLS = 35;

    public const float THRESHOLD = 0.5;

    public const int TICK_RATE = 30;

    /**
     * Per-tick step along a move order: {@code terrainSpeed * this} world units at {@see self::TICK_RATE} Hz.
     * Plains baseline uses {@see self::TERRAIN_SPEEDS} (plains = 1.0); raise this for faster marches.
     */
    public const float TROOP_MOVEMENT_PER_TICK_SCALE = 0.15;

    /** Ticks (~seconds×30) fresh troops get an attack “adrenaline” bonus that decays to neutral. */
    public const int TROOP_WARMUP_TICKS = 120;

    /** Peak multiplier at spawn (decays linearly over warmup). */
    public const float TROOP_WARMUP_ATTACK_PEAK = 1.45;

    public const int TROOP_MORALE_MIN = 15;

    public const int TROOP_MORALE_MAX = 100;

    /** Morale lost per tick while engaged with an enemy in range. */
    public const float TROOP_MORALE_COMBAT_DRAIN = 0.35;

    /** Morale recovered per tick when not in combat and in supply (near owned city). */
    public const float TROOP_MORALE_REST_GAIN = 0.22;

    /** If supply line to capital is this blocked (0–1), apply extra morale drain (encirclement). */
    public const float TROOP_SUPPLY_CUT_THRESHOLD = 0.55;

    public const float TROOP_SUPPLY_CUT_MORALE_DRAIN = 0.5;

    /** Starting credits per commander (spent on recruits). */
    public const int ECONOMY_STARTING_CREDITS = 220;

    /** Credits earned per owned city per tick (flags + capitals). */
    public const int ECONOMY_INCOME_PER_CITY_PER_TICK = 1;

    /** Cost to recruit one infantry at your capital. */
    public const int ECONOMY_RECRUIT_COST = 45;

    /** Minimum clearance from other units when spawning recruits. */
    public const int ECONOMY_RECRUIT_CLEARANCE = 22;

    /** Maximum infantry units per commander (auto-spawns + recruits). */
    public const int ECONOMY_MAX_ARMY_PER_PLAYER = 24;

    public const int MAX_PLAYERS = 6;

    public const int MIN_PLAYERS = 2;

    /** Wall-clock age after which an open lobby is closed without starting. */
    public const int LOBBY_MAX_AGE_SECONDS = 3600;

    /** If every commander has had no activity for this long, the match ends with no winner. */
    public const int MATCH_ALL_PLAYERS_INACTIVE_SECONDS = 120;

    public const string ABORTED_LOBBY_TIMEOUT = 'lobby_timeout';

    public const string ABORTED_MATCH_INACTIVITY = 'match_inactivity';

    /** @var array<string, float> */
    public const array TERRAIN_VALUES = [
        'water' => -0.1,
        'plains' => 0.1,
        'hill' => 0.7,
        'mountain' => 0.83,
    ];

    /** @var array<int, array{0: int, 1: int, 2: int}> */
    public const array COLORS = [
        [255, 0, 0],
        [0, 0, 255],
        [255, 150, 0],
        [175, 0, 175],
        [0, 175, 0],
        [0, 255, 255],
    ];

    /** @var array<string, float> */
    public const array TERRAIN_SPEEDS = [
        'water' => 0.6,
        'forest' => 0.8,
        'plains' => 1.0,
        'hill' => 0.7,
        'mountain' => 3.0,
    ];

    /** @var array<string, float> */
    public const array TERRAIN_ATTACKS = [
        'water' => 0.5,
        'forest' => 0.75,
        'plains' => 1.0,
        'hill' => 1.5,
        'mountain' => 0.0,
    ];

    public static function colorHex(int $slot): string
    {
        $rgb = self::COLORS[$slot] ?? self::COLORS[0];

        return sprintf('#%02x%02x%02x', $rgb[0], $rgb[1], $rgb[2]);
    }
}
