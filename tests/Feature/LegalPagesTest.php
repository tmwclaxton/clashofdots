<?php

namespace Tests\Feature;

use Tests\TestCase;

class LegalPagesTest extends TestCase
{
    public function test_terms_page_renders(): void
    {
        $response = $this->get(route('legal.terms'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('legal/Terms'));
    }

    public function test_privacy_page_renders(): void
    {
        $response = $this->get(route('legal.privacy'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('legal/Privacy'));
    }
}
