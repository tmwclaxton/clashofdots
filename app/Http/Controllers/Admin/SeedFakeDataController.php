<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Maps\MapGenerator;
use App\Models\Map;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

class SeedFakeDataController extends Controller
{
    private const FIRST_NAMES = [
        'James', 'Oliver', 'Harry', 'Jack', 'George', 'Noah', 'Charlie', 'Jacob',
        'Alfie', 'Freddie', 'Sophia', 'Olivia', 'Emily', 'Lily', 'Amelia', 'Emma',
        'Grace', 'Isabella', 'Ava', 'Mia', 'Liam', 'Ethan', 'Lucas', 'Mason',
        'Logan', 'Aiden', 'Caden', 'Jackson', 'Sebastian', 'Mateo',
    ];

    private const LAST_NAMES = [
        'Smith', 'Jones', 'Williams', 'Taylor', 'Brown', 'Davies', 'Evans',
        'Wilson', 'Thomas', 'Roberts', 'Johnson', 'White', 'Hall', 'Martin',
        'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez',
        'Lewis', 'Lee', 'Walker', 'Allen', 'Young', 'Harris', 'King', 'Scott',
    ];

    private const MAP_PREFIXES = [
        'Iron', 'Ash', 'Storm', 'Frost', 'Ember', 'Shadow', 'Crimson',
        'Stone', 'Thunder', 'Broken', 'Lost', 'Ancient', 'Sunken',
        'Bitter', 'Hollow', 'Cursed', 'Forsaken', 'Scarred', 'Burning',
        'Silent', 'Ruined', 'Forgotten', 'Barren', 'Shattered', 'Dark',
    ];

    private const MAP_NOUNS = [
        'Reach', 'Peaks', 'Vale', 'Basin', 'Expanse', 'Wastes', 'Shores',
        'Ridge', 'Gorge', 'Pass', 'Delta', 'Highlands', 'Frontier',
        'Citadel', 'Crossing', 'Flats', 'Marshes', 'Steppes', 'Tundra',
        'Archipelago', 'Straits', 'Outpost', 'Badlands', 'Peninsula',
        'Crater', 'Plateau', 'Canyons', 'Reef', 'Lagoon', 'Dunes',
    ];

    public function __invoke(MapGenerator $generator): RedirectResponse
    {
        for ($i = 0; $i < 10; $i++) {
            $firstName = self::FIRST_NAMES[array_rand(self::FIRST_NAMES)];
            $lastName = self::LAST_NAMES[array_rand(self::LAST_NAMES)];

            $user = User::create([
                'name' => "{$firstName} {$lastName}",
                'game_display_name' => User::generatePlayerTag(),
                'email' => strtolower($firstName).'.'.strtolower($lastName).'.'.Str::random(6).'@example.com',
                'email_verified_at' => now(),
                'workos_id' => 'seeded-'.Str::random(10),
                'avatar' => '',
                'avatar_style' => 'pixel-art',
                'fake_account' => true,
            ]);

            $count = random_int(1, 10);

            for ($j = 0; $j < $count; $j++) {
                $teamCount = random_int(2, 6);

                Map::create([
                    'user_id' => $user->id,
                    'name' => $this->randomMapName(),
                    'data' => $generator->random($teamCount),
                    'published' => true,
                    'published_at' => now(),
                ]);
            }
        }

        return back()->with('success', 'Generated 10 seeded accounts with published maps.');
    }

    private function randomMapName(): string
    {
        $article = random_int(0, 3) > 0 ? 'The ' : '';
        $prefix = self::MAP_PREFIXES[array_rand(self::MAP_PREFIXES)];
        $noun = self::MAP_NOUNS[array_rand(self::MAP_NOUNS)];

        return $article.$prefix.' '.$noun;
    }
}
