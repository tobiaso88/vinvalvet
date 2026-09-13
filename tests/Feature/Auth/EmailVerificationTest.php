<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_private_accounts_do_not_require_email_verification(): void
    {
        $this->actingAs(User::factory()->unverified()->create())->get('/dashboard')->assertOk();
        $this->get('/verify-email')->assertNotFound();
    }
}
