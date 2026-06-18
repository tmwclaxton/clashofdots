<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Map;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

class SeedFakeDataController extends Controller
{
    public function __invoke(): RedirectResponse
    {
        User::factory()
            ->count(10)
            ->fakeAccount()
            ->create()
            ->each(function (User $user): void {
                Map::factory()
                    ->count(random_int(1, 10))
                    ->published()
                    ->for($user)
                    ->create();
            });

        return back()->with('success', 'Generated 10 fake accounts with published maps.');
    }
}
