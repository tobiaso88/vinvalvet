<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

it('creates a user through an interactive command with a hashed password', function () {
    $this->artisan('winefinder:create-user')->expectsQuestion('Namn', 'Tobias')->expectsQuestion('E-postadress', 'tobias@example.test')
        ->expectsQuestion('Lösenord (minst 12 tecken)', 'a-strong-test-password')
        ->expectsQuestion('Bekräfta lösenord', 'a-strong-test-password')->assertSuccessful();
    $user = User::where('email', 'tobias@example.test')->firstOrFail();
    expect(Hash::check('a-strong-test-password', $user->password))->toBeTrue();
});

it('rejects mismatched command passwords without creating a user', function () {
    $this->artisan('winefinder:create-user')->expectsQuestion('Namn', 'Tobias')->expectsQuestion('E-postadress', 'tobias@example.test')
        ->expectsQuestion('Lösenord (minst 12 tecken)', 'a-strong-test-password')
        ->expectsQuestion('Bekräfta lösenord', 'different-password')->assertFailed();
    $this->assertDatabaseCount('users', 0);
});

it('resets a password and revokes sessions and remember tokens', function () {
    $user = User::factory()->create(['remember_token' => 'old-token']);
    DB::table('sessions')->insert(['id' => 'test-session', 'user_id' => $user->id, 'payload' => '', 'last_activity' => time()]);
    $this->artisan('winefinder:reset-password')->expectsQuestion('E-postadress', $user->email)
        ->expectsQuestion('Nytt lösenord (minst 12 tecken)', 'another-strong-password')
        ->expectsQuestion('Bekräfta lösenord', 'another-strong-password')->assertSuccessful();
    expect(Hash::check('another-strong-password', $user->fresh()->password))->toBeTrue();
    expect($user->fresh()->remember_token)->not->toBe('old-token');
    $this->assertDatabaseMissing('sessions', ['id' => 'test-session']);
});
