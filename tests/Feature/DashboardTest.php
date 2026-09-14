<?php

namespace Tests\Feature;

use App\Enums\BottleStatus;
use App\Models\Bottle;
use App\Models\User;
use App\Models\Wine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $this->actingAs($user = User::factory()->create());

        $this->get('/dashboard')->assertOk();
    }

    public function test_total_value_only_includes_the_users_available_valued_bottles(): void
    {
        $user = User::factory()->create();
        $wine = Wine::factory()->for($user)->create(['estimated_value' => 100]);
        Bottle::factory()->count(2)->for($wine)->create();
        Bottle::factory()->for($wine)->create(['status' => BottleStatus::Consumed]);
        $secondWine = Wine::factory()->for($user)->create(['estimated_value' => 250.50]);
        Bottle::factory()->for($secondWine)->create();
        Bottle::factory()->for(Wine::factory()->for($user)->create(['estimated_value' => null]))->create();
        Bottle::factory()->for(Wine::factory()->create(['estimated_value' => 999]))->create();

        $this->actingAs($user)->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page->where('stats.total_value', 450.5));
    }
}
