<?php

namespace App\Game;

use App\Maps\TerrainCatalog;

/**
 * Canonical game reference data for the wiki and future engine tuning.
 *
 * Values are inspired by War of Dots community guides, adapted for Clash of Dots
 * terrain types (12 editor terrains, infantry/tank split, capitals vs outposts).
 */
final class GameSpecs
{
    /**
     * @return list<array{
     *     id: string,
     *     label: string,
     *     role: string,
     *     health: int,
     *     recruitCost: int,
     *     upkeepPerSecond: float,
     *     defense: float,
     *     summary: string
     * }>
     */
    public static function troops(): array
    {
        return [
            [
                'id' => 'infantry',
                'label' => 'Infantry',
                'role' => 'Light',
                'health' => 100,
                'recruitCost' => 200,
                'upkeepPerSecond' => 1.0,
                'defense' => 1.0,
                'summary' => 'Fast, cheap, and resilient in forests and hills. Best for flanking, cycling, and holding rough terrain.',
            ],
            [
                'id' => 'tank',
                'label' => 'Tank',
                'role' => 'Heavy',
                'health' => 200,
                'recruitCost' => 400,
                'upkeepPerSecond' => 1.0,
                'defense' => 1.0,
                'summary' => 'Twice the health and damage on open ground, but slow in forests and deadly to push through water. Keep on plains, desert, or beach.',
            ],
        ];
    }

    /**
     * @return list<array{
     *     id: string,
     *     label: string,
     *     marker: string,
     *     incomePerTick: int,
     *     healMultiplier: float,
     *     summary: string
     * }>
     */
    public static function settlements(): array
    {
        return [
            [
                'id' => 'outpost',
                'label' => 'Outpost',
                'marker' => 'Flag (star)',
                'incomePerTick' => 1,
                'healMultiplier' => 2.0,
                'summary' => 'Capturable settlements scattered across the map. Each pays 1 credit per tick and can be toggled as a recruitment spawn point.',
            ],
            [
                'id' => 'capital',
                'label' => 'Capital',
                'marker' => 'Capital (hexagon)',
                'incomePerTick' => 1,
                'healMultiplier' => 2.0,
                'summary' => 'One per faction. Generates the same income as outposts but is the primary strategic objective — all enemy capitals must be captured to win.',
            ],
        ];
    }

    /**
     * Terrain speed and attack use War of Dots scale (plains infantry speed = 0.5, attack = 0.08).
     * Defense is a multiplier - both unit types share 1.0 (no inherent defense bonus).
     *
     * @return array<string, array{
     *     infantry: array{speed: float, attack: float, defense: float},
     *     tank: array{speed: float, attack: float, defense: float}
     * }>
     */
    public static function terrainCombat(): array
    {
        return [
            'plains' => [
                'infantry' => ['speed' => 0.5, 'attack' => 0.08, 'defense' => 1.0],
                'tank' => ['speed' => 0.3, 'attack' => 0.16, 'defense' => 1.0],
            ],
            'meadow' => [
                'infantry' => ['speed' => 0.5, 'attack' => 0.08, 'defense' => 1.0],
                'tank' => ['speed' => 0.32, 'attack' => 0.16, 'defense' => 1.0],
            ],
            'forest' => [
                'infantry' => ['speed' => 0.5, 'attack' => 0.08, 'defense' => 1.0],
                'tank' => ['speed' => 0.2, 'attack' => 0.08, 'defense' => 1.0],
            ],
            'dense_forest' => [
                'infantry' => ['speed' => 0.45, 'attack' => 0.07, 'defense' => 1.0],
                'tank' => ['speed' => 0.15, 'attack' => 0.06, 'defense' => 1.0],
            ],
            'hill' => [
                'infantry' => ['speed' => 0.5, 'attack' => 0.08, 'defense' => 1.0],
                'tank' => ['speed' => 0.2, 'attack' => 0.16, 'defense' => 1.0],
            ],
            'mountain' => [
                'infantry' => ['speed' => 0.01, 'attack' => 0.0, 'defense' => 1.0],
                'tank' => ['speed' => 0.01, 'attack' => 0.0, 'defense' => 1.0],
            ],
            'water' => [
                'infantry' => ['speed' => 0.12, 'attack' => 0.03, 'defense' => 0.75],
                'tank' => ['speed' => 0.1, 'attack' => 0.03, 'defense' => 0.75],
            ],
            'deep_water' => [
                'infantry' => ['speed' => 0.08, 'attack' => 0.02, 'defense' => 0.65],
                'tank' => ['speed' => 0.06, 'attack' => 0.02, 'defense' => 0.65],
            ],
            'river' => [
                'infantry' => ['speed' => 0.1, 'attack' => 0.02, 'defense' => 0.7],
                'tank' => ['speed' => 0.08, 'attack' => 0.02, 'defense' => 0.7],
            ],
            'swamp' => [
                'infantry' => ['speed' => 0.2, 'attack' => 0.04, 'defense' => 0.85],
                'tank' => ['speed' => 0.1, 'attack' => 0.08, 'defense' => 0.85],
            ],
            'desert' => [
                'infantry' => ['speed' => 0.3, 'attack' => 0.08, 'defense' => 1.0],
                'tank' => ['speed' => 0.3, 'attack' => 0.16, 'defense' => 1.0],
            ],
            'beach' => [
                'infantry' => ['speed' => 0.4, 'attack' => 0.07, 'defense' => 0.95],
                'tank' => ['speed' => 0.35, 'attack' => 0.14, 'defense' => 0.95],
            ],
            'snow' => [
                'infantry' => ['speed' => 0.35, 'attack' => 0.07, 'defense' => 1.0],
                'tank' => ['speed' => 0.20, 'attack' => 0.12, 'defense' => 1.0],
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function terrainDescriptions(): array
    {
        return [
            'plains' => 'Open grassland. No movement or combat penalties.',
            'meadow' => 'Soft rolling grass. Behaves like plains with a slight tank speed edge.',
            'forest' => 'Light woodland. Infantry unaffected; tanks slow and lose their damage advantage.',
            'dense_forest' => 'Thick woodland. Infantry penalty is mild; tanks are severely hampered.',
            'hill' => 'High ground. Tanks move slowly but keep full damage - strong on hilltops above forest.',
            'mountain' => 'Impassable peaks. Units cannot cross; no combat occurs here.',
            'water' => 'Shallow lakes. When a drafted path crosses water you choose Wade (instant, continuous HP drain, cannot enter deep water) or Embark (3 s shore conversion to a ship — faster on water, no drain, can cross deep water).',
            'deep_water' => 'Open ocean. Ships only — wading troops are blocked here. Embark before entering or route around.',
            'river' => 'Narrow waterways. Wading works for short crossings; embark if the river is wide or connects to open water.',
            'swamp' => 'Boggy wetland. Mud-like penalties slow everyone and reduce damage output.',
            'desert' => 'Sandy dunes. Tanks move as fast as infantry - the best heavy-unit terrain.',
            'beach' => 'Coastal sand. Minor slowdown; still favorable for tanks approaching landings.',
            'snow' => 'Frozen tundra. Icy ground slows all movement and chills attack output; tanks are hit hardest.',
        ];
    }

    /**
     * @return list<array{
     *     id: string,
     *     label: string,
     *     description: string,
     *     traits: list<string>,
     *     preview: string
     * }>
     */
    public static function mapGenerationTypes(): array
    {
        return [
            [
                'id' => 'mix',
                'label' => 'Mixed',
                'description' => 'Balanced continents with forests, deserts, hills, and carved river networks.',
                'traits' => ['Rivers enabled', 'Varied biomes', 'Good default for competitive play'],
                'preview' => '/images/wiki/map-generation-mix.svg',
            ],
            [
                'id' => 'islands',
                'label' => 'Islands',
                'description' => 'Two to four large islands in open ocean, with beaches, shallow coastal water, and deep sea beyond.',
                'traits' => ['Archipelago layout', 'Naval chokepoints', 'Troop placement favors coasts'],
                'preview' => '/images/wiki/map-generation-islands.svg',
            ],
            [
                'id' => 'desert',
                'label' => 'Desert',
                'description' => 'Vast arid dunes punctuated by lush oasis rings around scattered water.',
                'traits' => ['Tank-friendly terrain', 'No rivers', 'High-value oasis clusters'],
                'preview' => '/images/wiki/map-generation-desert.svg',
            ],
            [
                'id' => 'mountains',
                'label' => 'Mountains',
                'description' => 'Rugged highlands with valleys linked by carved mountain passes.',
                'traits' => ['Elevated chokepoints', 'Pass carving', 'Fewer open flanking routes'],
                'preview' => '/images/wiki/map-generation-mountains.svg',
            ],
            [
                'id' => 'jungle',
                'label' => 'Jungle',
                'description' => 'Impenetrable rainforest canopy threaded by winding rivers and swampland.',
                'traits' => ['Dense forest cover', 'Rivers and swamp', 'Tanks heavily penalised'],
                'preview' => '/images/wiki/map-generation-jungle.svg',
            ],
            [
                'id' => 'volcanic',
                'label' => 'Volcanic',
                'description' => 'Smouldering mountain peaks surrounded by vast ash fields and hardened lava rock.',
                'traits' => ['Dominant mountain peaks', 'Ash-field desert lowlands', 'No rivers'],
                'preview' => '/images/wiki/map-generation-volcanic.svg',
            ],
            [
                'id' => 'tundra',
                'label' => 'Tundra',
                'description' => 'Frozen wastes of open plains and sparse taiga beneath jagged ice-capped peaks.',
                'traits' => ['Wide open plains', 'Sparse forest', 'No rivers'],
                'preview' => '/images/wiki/map-generation-tundra.svg',
            ],
            [
                'id' => 'grassland',
                'label' => 'Grassland',
                'description' => 'Sweeping open meadows and plains with scattered forests, gentle rivers, and almost no mountains.',
                'traits' => ['Flat open terrain', 'Rivers and meadows', 'Tank-friendly'],
                'preview' => '/images/wiki/map-generation-grassland.svg',
            ],
        ];
    }

    /**
     * @return list<array{
     *     title: string,
     *     body: string,
     *     icon: string
     * }>
     */
    public static function economyNotes(): array
    {
        return [
            [
                'title' => 'Income',
                'icon' => 'coins',
                'body' => 'Every city and outpost you own pays 1 credit per tick (~30 credits/second per city). Income stacks — the more settlements you hold, the faster your war chest grows.',
            ],
            [
                'title' => 'Spawn cost',
                'icon' => 'user-plus',
                'body' => 'Spawning a unit deducts credits immediately: infantry costs 200, tanks cost 400. You need the funds in your balance at the moment a recruitment city tries to produce.',
            ],
            [
                'title' => 'Army upkeep',
                'icon' => 'wallet',
                'body' => 'Every troop on the field costs 1 credit per tick regardless of type or health. A large army drains your treasury fast — you can sustain a bigger force temporarily by saving credits, but you will eventually need to downsize.',
            ],
            [
                'title' => 'Debt damage',
                'icon' => 'package',
                'body' => 'If your credit balance goes negative, your troops take HP damage every tick proportional to the debt: 1 HP per 10 credits owed, applied to tanks first, then newest infantry. Recapture cities or let units die to get back into the black.',
            ],
            [
                'title' => 'Recruitment',
                'icon' => 'radar',
                'body' => 'Open the Recruit panel and toggle any owned city or outpost on (green) or off (red) as a spawn point. Two global sliders control speed (Off → Fast) and unit mix (Infantry → Tanks). Troops spawn at 25% HP and only if the city is unoccupied and you can afford the cost.',
            ],
            [
                'title' => 'Water crossing',
                'icon' => 'waves',
                'body' => 'When a drafted path crosses water a prompt lets you choose Wade or Embark. Wade is instant but drains HP every tick and cannot enter deep water. Embark spends ~3 s converting the unit to a ship at the shore — ships move faster, take no water damage, and can cross deep water freely. The ship reverts to a troop the moment it reaches dry land.',
            ],
        ];
    }

    /**
     * @return array{
     *     troops: list<array<string, mixed>>,
     *     settlements: list<array<string, mixed>>,
     *     terrain: list<array<string, mixed>>,
     *     mapGeneration: list<array<string, mixed>>,
     *     economyNotes: list<array{title: string, body: string, icon: string}>
     * }
     */
    public static function forWiki(): array
    {
        $combat = self::terrainCombat();
        $descriptions = self::terrainDescriptions();
        $terrain = [];

        foreach (TerrainCatalog::forClient() as $entry) {
            $id = $entry['id'];
            $effects = $combat[$id];

            $terrain[] = [
                'id' => $id,
                'label' => $entry['label'],
                'color' => $entry['color'],
                'isWater' => $entry['isWater'],
                'description' => $descriptions[$id],
                'infantry' => $effects['infantry'],
                'tank' => $effects['tank'],
                'impassable' => $id === 'mountain',
            ];
        }

        return [
            'troops' => self::troops(),
            'settlements' => self::settlements(),
            'terrain' => $terrain,
            'mapGeneration' => self::mapGenerationTypes(),
            'economyNotes' => self::economyNotes(),
        ];
    }
}
