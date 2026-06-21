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

    /**
     * @param  array<string, mixed>  $query
     * @return list<array<string, mixed>>
     */
    private function deferredMaps(array $query = []): array
    {
        $manifest = public_path('build/manifest.json');
        $version = file_exists($manifest) ? hash_file('xxh128', $manifest) : '';

        $response = $this->get(
            route('maps.explore', $query),
            [
                'X-Inertia' => 'true',
                'X-Inertia-Version' => $version,
                'X-Inertia-Partial-Component' => 'MapExplore',
                'X-Inertia-Partial-Data' => 'maps,pagination',
            ],
        );

        $response->assertOk();

        /** @var array{props: array{maps: list<array<string, mixed>>}} $json */
        $json = $response->json();

        return $json['props']['maps'];
    }

    public function test_no_maps_are_pinned_when_no_geo_maps_exist(): void
    {
        $maps = $this->deferredMaps();

        $this->assertEmpty(array_filter($maps, fn ($m) => $m['isPinned']));
    }

    public function test_geo_maps_have_is_pinned_true_when_no_filters(): void
    {
        $admin = $this->adminUser();
        $this->createGeoMap($admin, 'Europe');
        $this->createGeoMap($admin, 'The World');

        $maps = $this->deferredMaps();

        $pinned = array_filter($maps, fn ($m) => $m['isPinned']);
        $this->assertCount(2, $pinned);
    }

    public function test_geo_maps_appear_first_ordered_by_name(): void
    {
        $admin = $this->adminUser();
        $this->createGeoMap($admin, 'The World');
        $this->createGeoMap($admin, 'Europe');
        $this->createGeoMap($admin, 'North America');

        $maps = $this->deferredMaps();

        $this->assertEquals('Europe', $maps[0]['name']);
        $this->assertEquals('North America', $maps[1]['name']);
        $this->assertEquals('The World', $maps[2]['name']);
        $this->assertTrue($maps[0]['isPinned']);
        $this->assertTrue($maps[1]['isPinned']);
        $this->assertTrue($maps[2]['isPinned']);
    }

    public function test_geo_maps_not_pinned_when_text_filter_active(): void
    {
        $admin = $this->adminUser();
        $this->createGeoMap($admin, 'Europe');

        $maps = $this->deferredMaps(['q' => 'Europe']);

        foreach ($maps as $map) {
            $this->assertFalse($map['isPinned']);
        }
    }

    public function test_geo_maps_not_pinned_when_author_filter_active(): void
    {
        $admin = $this->adminUser();
        $this->createGeoMap($admin, 'Europe');

        $maps = $this->deferredMaps(['author' => 'someone']);

        $this->assertEmpty($maps);
    }

    public function test_geo_maps_not_pinned_when_sort_is_not_newest(): void
    {
        $admin = $this->adminUser();
        $this->createGeoMap($admin, 'Europe');

        $maps = $this->deferredMaps(['sort' => 'most_games']);

        foreach ($maps as $map) {
            $this->assertFalse($map['isPinned']);
        }
    }

    public function test_geo_maps_prepended_before_regular_maps_when_no_filters(): void
    {
        $admin = $this->adminUser();
        $this->createGeoMap($admin, 'Europe');

        $regular = User::factory()->create();
        Map::factory()->for($regular)->published()->create(['name' => 'Regular Map']);

        $maps = $this->deferredMaps();

        $this->assertEquals('Europe', $maps[0]['name']);
        $this->assertTrue($maps[0]['isPinned']);
        $this->assertEquals('Regular Map', $maps[1]['name']);
        $this->assertFalse($maps[1]['isPinned']);
    }

    public function test_non_geo_published_maps_are_never_pinned(): void
    {
        $user = User::factory()->create();
        Map::factory()->for($user)->published()->create([
            'name' => 'Community Map',
            'is_geo_map' => false,
        ]);

        $maps = $this->deferredMaps();

        foreach ($maps as $map) {
            $this->assertFalse($map['isPinned']);
        }
    }

    public function test_explore_page_renders_without_pinnedmaps_prop(): void
    {
        $this->get(route('maps.explore'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('MapExplore')
                ->missing('pinnedMaps')
                ->has('filters')
            );
    }
}
