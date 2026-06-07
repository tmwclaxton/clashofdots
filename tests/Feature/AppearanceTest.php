<?php

namespace Tests\Feature;

use Tests\TestCase;

class AppearanceTest extends TestCase
{
    public function test_dark_appearance_cookie_applies_dark_class_on_initial_render(): void
    {
        $response = $this->withUnencryptedCookie('appearance', 'dark')
            ->get(route('home'));

        $response->assertOk();
        $response->assertSee('class="dark"', false);
    }

    public function test_light_appearance_cookie_does_not_apply_dark_class(): void
    {
        $response = $this->withUnencryptedCookie('appearance', 'light')
            ->get(route('home'));

        $response->assertOk();
        $this->assertStringNotContainsString('class="dark"', $response->getContent());
    }

    public function test_system_appearance_defaults_without_dark_class_on_server(): void
    {
        $response = $this->get(route('home'));

        $response->assertOk();
        $this->assertStringNotContainsString('class="dark"', $response->getContent());
        $response->assertSee('prefers-color-scheme: dark', false);
    }
}
