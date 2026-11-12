<?php

namespace Tests\Feature;

use App\Enums\BottleStatus;
use App\Models\Bottle;
use App\Models\User;
use App\Models\Wine;
use App\Models\WineRack;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NativeCellarPagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_cellar_pages_require_authentication(): void
    {
        $this->get('/settings')->assertRedirect('/login');
        $this->get('/racks/unplaced')->assertRedirect('/login');
    }

    public function test_settings_renders_the_account_navigation(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/settings')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('settings/index'));
    }

    public function test_unplaced_page_only_exposes_the_users_available_unplaced_bottles_and_racks(): void
    {
        $user = User::factory()->create();
        $wine = Wine::factory()->for($user)->create();
        $rack = WineRack::factory()->for($user)->create();
        $unplaced = Bottle::factory()->for($wine)->create();
        Bottle::factory()->for($wine)->create(['status' => BottleStatus::Consumed]);
        Bottle::factory()->for($wine)->create(['status' => BottleStatus::Removed]);
        Bottle::factory()->for($wine)->create(['wine_rack_id' => $rack->id, 'row' => 1, 'column' => 1]);
        Bottle::factory()->create();
        WineRack::factory()->create();

        $this->actingAs($user)->get('/racks/unplaced')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('racks/unplaced')
                ->has('unplaced', 1)->where('unplaced.0.id', $unplaced->id)
                ->has('racks', 1)->where('racks.0.id', $rack->id)
                ->has('racks.0.bottles', 1)
                ->where('racks.0.bottles.0.wine.id', $wine->id));

        $this->get('/racks')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('racks/index')->where('unplacedCount', 1));
    }
}
