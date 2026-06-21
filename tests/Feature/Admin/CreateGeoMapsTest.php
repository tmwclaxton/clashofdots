<?php

namespace Tests\Feature\Admin;

use App\Maps\GeoMapGenerator;
use App\Maps\MapEditorGrid;
use App\Models\Map;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CreateGeoMapsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function fakeMapData(): array
    {
        return MapEditorGrid::emptyData();
    }

    private function mockGenerator(): void
    {
        $this->mock(GeoMapGenerator::class, function ($mock): void {
            $mock->shouldReceive('generate')
                ->andReturn($this->fakeMapData());
        });
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->post(route('admin.create-geo-maps'))
            ->assertRedirect(route('login'));
    }

    public function test_non_admin_users_are_forbidden(): void
    {
        $user = User::factory()->create(['email' => 'someone@example.com']);

        $this->actingAs($user)
            ->post(route('admin.create-geo-maps'))
            ->assertForbidden();
    }

    public function test_admin_can_create_three_geo_maps(): void
    {
        $this->mockGenerator();

        $admin = User::factory()->create(['email' => 'tmwclaxton@gmail.com']);

        $this->actingAs($admin)
            ->post(route('admin.create-geo-maps'))
            ->assertRedirect();

        $this->assertDatabaseCount('maps', 3);

        foreach (GeoMapGenerator::TYPES as $type => $label) {
            $this->assertDatabaseHas('maps', [
                'name' => $label,
                'user_id' => $admin->id,
                'published' => true,
                'is_geo_map' => true,
            ]);
        }
    }

    public function test_geo_maps_are_idempotent_and_not_duplicated(): void
    {
        $this->mockGenerator();

        $admin = User::factory()->create(['email' => 'tmwclaxton@gmail.com']);

        $this->actingAs($admin)->post(route('admin.create-geo-maps'));
        $this->actingAs($admin)->post(route('admin.create-geo-maps'));

        $this->assertDatabaseCount('maps', 3);
    }

    public function test_skip_message_when_all_maps_already_exist(): void
    {
        $this->mockGenerator();

        $admin = User::factory()->create(['email' => 'tmwclaxton@gmail.com']);

        foreach (GeoMapGenerator::TYPES as $type => $label) {
            Map::factory()->for($admin)->published()->create([
                'name' => $label,
                'is_geo_map' => true,
            ]);
        }

        $this->actingAs($admin)
            ->post(route('admin.create-geo-maps'))
            ->assertRedirect()
            ->assertSessionHas('info');
    }

    public function test_partial_creation_when_some_maps_already_exist(): void
    {
        $this->mockGenerator();

        $admin = User::factory()->create(['email' => 'tmwclaxton@gmail.com']);

        Map::factory()->for($admin)->published()->create([
            'name' => 'Europe',
            'is_geo_map' => true,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.create-geo-maps'))
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseCount('maps', 3);
    }

    public function test_overview_page_includes_geo_maps_status(): void
    {
        $admin = User::factory()->create(['email' => 'tmwclaxton@gmail.com']);

        $this->actingAs($admin)
            ->get(route('admin.overview'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Overview')
                ->has('geoMapsStatus', fn (Assert $status) => $status
                    ->hasAll(['europe', 'north_america', 'world'])
                    ->where('europe', false)
                    ->where('north_america', false)
                    ->where('world', false)
                )
            );
    }

    public function test_overview_geo_maps_status_reflects_existing_maps(): void
    {
        $admin = User::factory()->create(['email' => 'tmwclaxton@gmail.com']);

        Map::factory()->for($admin)->published()->create([
            'name' => 'Europe',
            'is_geo_map' => true,
        ]);

        $this->actingAs($admin)
            ->get(route('admin.overview'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Overview')
                ->has('geoMapsStatus', fn (Assert $status) => $status
                    ->where('europe', true)
                    ->where('north_america', false)
                    ->where('world', false)
                )
            );
    }
}
