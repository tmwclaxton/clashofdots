<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Maps\MapGenerator;
use App\Models\Map;
use App\Models\User;
use Faker\Factory as Faker;
use Faker\Generator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

class SeedFakeDataController extends Controller
{
    public function __invoke(MapGenerator $generator): RedirectResponse
    {
        $faker = Faker::create();

        for ($i = 0; $i < 10; $i++) {
            $user = User::create([
                'name' => $faker->name(),
                'game_display_name' => User::generatePlayerTag(),
                'email' => $faker->unique()->safeEmail(),
                'email_verified_at' => now(),
                'workos_id' => 'fake-'.Str::random(10),
                'avatar' => '',
                'avatar_style' => 'pixel-art',
                'fake_account' => true,
            ]);

            $count = random_int(1, 10);

            for ($j = 0; $j < $count; $j++) {
                $teamCount = random_int(2, 6);

                Map::create([
                    'user_id' => $user->id,
                    'name' => $this->randomMapName($faker),
                    'data' => $generator->random($teamCount),
                    'published' => true,
                    'published_at' => now(),
                ]);
            }
        }

        return back()->with('success', 'Generated 10 fake accounts with published maps.');
    }

    private function randomMapName(Generator $faker): string
    {
        $prefixes = [
            'Iron', 'Ash', 'Storm', 'Frost', 'Ember', 'Shadow', 'Crimson',
            'Stone', 'Thunder', 'Broken', 'Lost', 'Ancient', 'Sunken',
            'Bitter', 'Hollow', 'Cursed', 'Forsaken', 'Scarred', 'Burning',
            'Silent', 'Ruined', 'Forgotten', 'Barren', 'Shattered', 'Dark',
        ];

        $nouns = [
            'Reach', 'Peaks', 'Vale', 'Basin', 'Expanse', 'Wastes', 'Shores',
            'Ridge', 'Gorge', 'Pass', 'Delta', 'Highlands', 'Frontier',
            'Citadel', 'Crossing', 'Flats', 'Marshes', 'Steppes', 'Tundra',
            'Archipelago', 'Straits', 'Outpost', 'Badlands', 'Peninsula',
            'Crater', 'Plateau', 'Canyons', 'Reef', 'Lagoon', 'Dunes',
        ];

        $article = $faker->boolean(75) ? 'The ' : '';

        return $article.$faker->randomElement($prefixes).' '.$faker->randomElement($nouns);
    }
}
