<?php

namespace Tests\Feature\Admin;

use App\Models\Map;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeedFakeDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_login(): void
    {
        $this->post(route('admin.seed-fake-data'))
            ->assertRedirect(route('login'));
    }

    public function test_non_admin_users_are_forbidden(): void
    {
        $user = User::factory()->create(['email' => 'someone@example.com']);

        $this->actingAs($user)
            ->post(route('admin.seed-fake-data'))
            ->assertForbidden();
    }

    public function test_admin_can_seed_10_fake_accounts_with_published_maps(): void
    {
        $admin = User::factory()->create(['email' => 'tmwclaxton@gmail.com']);

        $this->actingAs($admin)
            ->post(route('admin.seed-fake-data'))
            ->assertRedirect();

        $this->assertDatabaseCount('users', 11); // admin + 10 fake

        $fakeUsers = User::query()->where('fake_account', true)->get();
        $this->assertCount(10, $fakeUsers);

        foreach ($fakeUsers as $fakeUser) {
            $maps = Map::query()->where('user_id', $fakeUser->id)->get();
            $this->assertGreaterThanOrEqual(1, $maps->count());
            $this->assertLessThanOrEqual(10, $maps->count());

            foreach ($maps as $map) {
                $this->assertTrue($map->published);
                $this->assertNotNull($map->published_at);
            }
        }
    }

    public function test_fake_account_is_false_on_regular_users(): void
    {
        $user = User::factory()->create(['email' => 'someone@example.com']);

        $this->assertFalse($user->fresh()->fake_account);
    }
}
