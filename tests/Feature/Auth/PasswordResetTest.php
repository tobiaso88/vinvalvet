<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_password_recovery_is_disabled(): void
    {
        Notification::fake();
        $user = User::factory()->create();
        $this->get('/forgot-password')->assertNotFound();
        $this->post('/forgot-password', ['email' => $user->email])->assertNotFound();
        $this->get('/reset-password/token')->assertNotFound();
        $this->post('/reset-password', ['email' => $user->email])->assertNotFound();
        Notification::assertNothingSent();
    }
}
