<?php

namespace Tests\Feature\Maps;

use App\Models\Map;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MapExplorePinnedTest extends TestCase
{
    use RefreshDatabase;

    private function adminUser(): User
    {
        return User::factory()->create(['email' => 'tmwclaxton@gmail.com']);
    }

    private function createGeoMap(User $author, string $name): Map
    {
        return Map::factory()->for($author)->published()->create([
            'name' => $name,
            'is_geo_map' => true,
        ]);
    }

    public function test_pinned_maps_prop_is_empty_when_no_geo_maps_exist(): void
    {
        $this->get(route('maps.explore'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('MapExplore')
                ->where('pinnedMaps', [])
            );
    }

    public function test_geo_maps_appear_in_pinned_maps_when_no_filters(): void
    {
        $admin = $this->adminUser();
        $europe = $this->createGeoMap($admin, 'Europe');
        $world = $this->createGeoMap($admin, 'The World');

        $this->get(route('maps.explore'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('MapExplore')
                ->has('pinnedMaps', 2)
            );
    }

    public function test_pinned_maps_are_ordered_by_name(): void
    {
        $admin = $this->adminUser();
        $this->createGeoMap($admin, 'The World');
        $this->createGeoMap($admin, 'Europe');
        $this->createGeoMap($admin, 'North America');

        $this->get(route('maps.explore'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('MapExplore')
                ->has('pinnedMaps', 3)
                ->where('pinnedMaps.0.name', 'Europe')
                ->where('pinnedMaps.1.name', 'North America')
                ->where('pinnedMaps.2.name', 'The World')
            );
    }

    public function test_pinned_maps_are_hidden_when_text_filter_active(): void
    {
        $admin = $this->adminUser();
        $this->createGeoMap($admin, 'Europe');

        $this->get(route('maps.explore', ['q' => 'battle']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('pinnedMaps', [])
            );
    }

    public function test_pinned_maps_are_hidden_when_author_filter_active(): void
    {
        $admin = $this->adminUser();
        $this->createGeoMap($admin, 'Europe');

        $this->get(route('maps.explore', ['author' => 'someone']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('pinnedMaps', [])
            );
    }

    public function test_pinned_maps_are_hidden_when_uuid_filter_active(): void
    {
        $admin = $this->adminUser();
        $this->createGeoMap($admin, 'Europe');

        $user = User::factory()->create();
        $other = Map::factory()->for($user)->published()->create(['name' => 'Other Map']);

        $this->get(route('maps.explore', ['uuid' => $other->uuid]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('pinnedMaps', [])
            );
    }

    public function test_pinned_maps_are_hidden_when_sort_is_not_newest(): void
    {
        $admin = $this->adminUser();
        $this->createGeoMap($admin, 'Europe');

        $this->get(route('maps.explore', ['sort' => 'most_games']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('pinnedMaps', [])
            );
    }

    public function test_geo_maps_are_excluded_from_main_paginated_results_when_pinned(): void
    {
        $manifest = public_path('build/manifest.json');
        $version = file_exists($manifest) ? hash_file('xxh128', $manifest) : '';

        $admin = $this->adminUser();
        $this->createGeoMap($admin, 'Europe');

        $regular = User::factory()->create();
        Map::factory()->for($regular)->published()->create(['name' => 'Regular Map']);

        $response = $this->get(
            route('maps.explore'),
            [
                'X-Inertia' => 'true',
                'X-Inertia-Version' => $version,
                'X-Inertia-Partial-Component' => 'MapExplore',
                'X-Inertia-Partial-Data' => 'maps,pagination',
            ],
        );

        $response->assertOk();

        /** @var array{props: array{maps: list<array<string, mixed>>, pagination: array<string, mixed>}} $json */
        $json = $response->json();
        $maps = $json['props']['maps'];

        $this->assertCount(1, $maps);
        $this->assertEquals('Regular Map', $maps[0]['name']);
    }

    public function test_geo_maps_appear_in_main_results_when_filters_applied(): void
    {
        $manifest = public_path('build/manifest.json');
        $version = file_exists($manifest) ? hash_file('xxh128', $manifest) : '';

        $admin = $this->adminUser();
        $this->createGeoMap($admin, 'Europe');

        $response = $this->get(
            route('maps.explore', ['q' => 'Europe']),
            [
                'X-Inertia' => 'true',
                'X-Inertia-Version' => $version,
                'X-Inertia-Partial-Component' => 'MapExplore',
                'X-Inertia-Partial-Data' => 'maps,pagination',
            ],
        );

        $response->assertOk();

        /** @var array{props: array{maps: list<array<string, mixed>>, pagination: array<string, mixed>}} $json */
        $json = $response->json();
        $maps = $json['props']['maps'];

        $this->assertCount(1, $maps);
        $this->assertEquals('Europe', $maps[0]['name']);
    }

    public function test_non_geo_published_maps_are_never_pinned(): void
    {
        $user = User::factory()->create();
        Map::factory()->for($user)->published()->create([
            'name' => 'Community Map',
            'is_geo_map' => false,
        ]);

        $this->get(route('maps.explore'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('pinnedMaps', [])
            );
    }
}
