<?php

namespace Tests\Unit;

use App\Models\User;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class UserIsAdminTest extends TestCase
{
    #[DataProvider('adminEmails')]
    public function test_admin_emails_are_recognized(string $email): void
    {
        $user = new User(['email' => $email]);

        $this->assertTrue($user->isAdmin());
    }

    public function test_non_admin_emails_are_rejected(): void
    {
        $user = new User(['email' => 'someone@example.com']);

        $this->assertFalse($user->isAdmin());
    }

    /**
     * @return array<string, array{string}>
     */
    public static function adminEmails(): array
    {
        return [
            'gmail' => ['tmwclaxton@gmail.com'],
            'grantgunner' => ['toby@grantgunner.org'],
        ];
    }
}
