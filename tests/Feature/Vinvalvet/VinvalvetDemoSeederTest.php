<?php

use App\Models\User;
use Database\Seeders\VinvalvetDemoSeeder;

it('creates canonical demo data once', function () {
    $this->seed(VinvalvetDemoSeeder::class);

    $user = User::where('email', 'demo@vinvalvet.test')->firstOrFail();
    $password = $user->getRawOriginal('password');

    $this->seed(VinvalvetDemoSeeder::class);

    $this->assertDatabaseCount('users', 1);
    $this->assertDatabaseCount('wine_racks', 2);
    $this->assertDatabaseCount('wines', 6);
    $this->assertDatabaseCount('bottles', 19);
    $this->assertDatabaseMissing('users', ['email' => 'demo@winefinder.test']);
    expect($user->fresh()->getRawOriginal('password'))->toBe($password);
});

it('renames a legacy demo account without changing its data', function () {
    $user = User::factory()->create([
        'email' => 'demo@winefinder.test',
        'password' => 'legacy-password',
    ]);
    $rack = $user->racks()->create([
        'name' => 'Befintlig hylla',
        'rows' => 2,
        'columns' => 3,
    ]);
    $password = $user->getRawOriginal('password');

    $this->seed(VinvalvetDemoSeeder::class);

    $this->assertDatabaseCount('users', 1);
    $this->assertDatabaseHas('users', ['id' => $user->id, 'email' => 'demo@vinvalvet.test']);
    $this->assertDatabaseMissing('users', ['email' => 'demo@winefinder.test']);
    $this->assertDatabaseHas('wine_racks', ['id' => $rack->id, 'user_id' => $user->id]);
    expect($user->fresh()->getRawOriginal('password'))->toBe($password);
});
