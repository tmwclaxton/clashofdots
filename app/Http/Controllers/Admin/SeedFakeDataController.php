<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Maps\MapGenerator;
use App\Models\Map;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

class SeedFakeDataController extends Controller
{
    public function __invoke(MapGenerator $generator): RedirectResponse
    {
        User::factory()
            ->count(10)
            ->fakeAccount()
            ->create()
            ->each(function (User $user) use ($generator): void {
                $count = random_int(1, 10);

                for ($i = 0; $i < $count; $i++) {
                    $teamCount = random_int(2, 6);

                    Map::factory()
                        ->published()
                        ->for($user)
                        ->create(['data' => $generator->random($teamCount)]);
                }
            });

        return back()->with('success', 'Generated 10 fake accounts with published maps.');
    }
}
