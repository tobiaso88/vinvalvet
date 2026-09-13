<?php

use App\Enums\BottleEventType;
use App\Enums\BottleStatus;
use App\Enums\WineBody;
use App\Enums\WineType;
use App\Models\Bottle;
use App\Models\Grape;
use App\Models\User;
use App\Models\Wine;
use App\Models\WineRack;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

function winePayload(array $changes = []): array
{
    return array_merge(['name' => 'Barolo', 'type' => 'red', 'vintage' => 2020, 'grapes' => ['Nebbiolo'], 'quantity' => 2, 'positions' => []], $changes);
}

it('creates wine grapes and positioned bottles with immutable event locations', function () {
    $user = User::factory()->create();
    $rack = WineRack::factory()->for($user)->create(['name' => 'Källaren']);
    $this->actingAs($user)->post('/wines', winePayload(['positions' => [['wine_rack_id' => $rack->id, 'row' => 1, 'column' => 2]]]))->assertSessionHasNoErrors()->assertRedirect();
    $wine = $user->wines()->firstOrFail();
    expect($wine->type)->toBe(WineType::Red);
    expect($wine->grapes->pluck('name')->all())->toBe(['Nebbiolo']);
    expect($wine->bottles()->count())->toBe(2);
    $this->assertDatabaseHas('bottles', ['wine_id' => $wine->id, 'row' => 1, 'column' => 2, 'wine_rack_id' => $rack->id]);
    $this->assertDatabaseHas('bottle_events', ['type' => 'placed', 'to_location' => 'Källaren · A2']);
    $this->actingAs($user)->put('/racks/'.$rack->id, ['name' => 'Ny hylla', 'rows' => 4, 'columns' => 6])->assertSessionHasNoErrors();
    $this->assertDatabaseHas('bottle_events', ['type' => 'placed', 'to_location' => 'Källaren · A2']);
});

it('casts nullable bodies and event types to enums', function () {
    $wine = Wine::factory()->create(['body' => WineBody::Full]);
    $this->actingAs($wine->user)->post('/bottles', ['wine_id' => $wine->id])->assertSessionHasNoErrors();
    expect($wine->body)->toBe(WineBody::Full);
    expect($wine->bottles()->first()->events()->first()->type)->toBe(BottleEventType::Created);
    $wine->update(['body' => null]);
    expect($wine->fresh()->body)->toBeNull();
});

it('saves a wine without grapes and clears grapes omitted by multipart forms', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->post('/wines', ['name' => 'Okänd druva', 'type' => 'white', 'quantity' => 1])
        ->assertSessionHasNoErrors()->assertRedirect();
    $wine = $user->wines()->firstOrFail();
    expect($wine->grapes)->toHaveCount(0);
    expect($wine->bottles)->toHaveCount(1);
    $wine->grapes()->attach(Grape::factory()->create());

    $this->post('/wines/'.$wine->id, ['_method' => 'put', 'name' => 'Okänd druva', 'type' => 'white'])
        ->assertSessionHasNoErrors()->assertRedirect();

    expect($wine->fresh()->grapes)->toHaveCount(0);
});

it('rejects duplicate placement and rolls back an entire batch', function () {
    $user = User::factory()->create();
    $rack = WineRack::factory()->for($user)->create();
    $position = ['wine_rack_id' => $rack->id, 'row' => 1, 'column' => 1];
    $this->actingAs($user)->post('/wines', winePayload(['positions' => [$position, $position]]))->assertSessionHasErrors('position');
    $this->assertDatabaseCount('wines', 0);
    $this->assertDatabaseCount('bottles', 0);
    $this->assertDatabaseCount('bottle_events', 0);
});

it('enforces the unique physical position even for a direct insert', function () {
    $wine = Wine::factory()->create();
    $rack = WineRack::factory()->for($wine->user)->create();
    $position = ['wine_rack_id' => $rack->id, 'row' => 1, 'column' => 1];
    $wine->bottles()->create($position);
    expect(fn () => $wine->bottles()->create($position))->toThrow(UniqueConstraintViolationException::class);
});

it('moves and consumes a bottle and refuses a second consumption', function () {
    $wine = Wine::factory()->create();
    $rack = WineRack::factory()->for($wine->user)->create(['name' => 'Vinkylen']);
    $bottle = Bottle::factory()->for($wine)->create();
    $this->actingAs($wine->user)->patch('/bottles/'.$bottle->id.'/place', ['wine_rack_id' => $rack->id, 'row' => 2, 'column' => 3])->assertSessionHasNoErrors();
    $this->post('/bottles/'.$bottle->id.'/consume')->assertSessionHasNoErrors();
    expect($bottle->fresh()->status)->toBe(BottleStatus::Consumed);
    $this->assertDatabaseHas('bottles', ['id' => $bottle->id, 'wine_rack_id' => null, 'row' => null, 'column' => null]);
    $this->assertDatabaseHas('bottle_events', ['bottle_id' => $bottle->id, 'type' => 'consumed', 'from_location' => 'Vinkylen · B3']);
    $this->post('/bottles/'.$bottle->id.'/consume')->assertSessionHasErrors('bottle');
    expect($bottle->events()->where('type', 'consumed')->count())->toBe(1);
});

it('rejects out of bounds placement and occupied slot without losing original location', function () {
    $wine = Wine::factory()->create();
    $rack = WineRack::factory()->for($wine->user)->create(['rows' => 2, 'columns' => 2]);
    $bottle = Bottle::factory()->for($wine)->create(['wine_rack_id' => $rack->id, 'row' => 1, 'column' => 1]);
    Bottle::factory()->for($wine)->create(['wine_rack_id' => $rack->id, 'row' => 1, 'column' => 2]);
    $this->actingAs($wine->user)->patch('/bottles/'.$bottle->id.'/place', ['wine_rack_id' => $rack->id, 'row' => 1, 'column' => 2])->assertSessionHasErrors('position');
    $this->patch('/bottles/'.$bottle->id.'/place', ['wine_rack_id' => $rack->id, 'row' => 3, 'column' => 1])->assertSessionHasErrors('position');
    expect($bottle->fresh()->column)->toBe(1);
});

it('prevents shrinking or deleting an occupied rack and keeps history after removal', function () {
    $wine = Wine::factory()->create();
    $rack = WineRack::factory()->for($wine->user)->create();
    $bottle = Bottle::factory()->for($wine)->create(['wine_rack_id' => $rack->id, 'row' => 4, 'column' => 6]);
    $this->actingAs($wine->user)->put('/racks/'.$rack->id, ['name' => 'Small', 'rows' => 2, 'columns' => 2])->assertSessionHasErrors('rows');
    $this->delete('/racks/'.$rack->id)->assertSessionHasErrors('rack');
    $this->delete('/bottles/'.$bottle->id)->assertSessionHasNoErrors();
    $this->delete('/racks/'.$rack->id)->assertSessionHasNoErrors();
    $this->assertDatabaseMissing('wine_racks', ['id' => $rack->id]);
    expect($bottle->fresh()->status)->toBe(BottleStatus::Removed);
    expect($bottle->events()->count())->toBe(1);
});

it('isolates reads and writes between accounts', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $wine = Wine::factory()->for($owner)->create();
    $rack = WineRack::factory()->for($owner)->create();
    $bottle = Bottle::factory()->for($wine)->create();
    $this->actingAs($other);
    foreach (['/wines/'.$wine->id, '/wines/'.$wine->id.'/edit', '/wines/'.$wine->id.'/label', '/racks/'.$rack->id] as $url) {
        $this->get($url)->assertNotFound();
    }
    $this->put('/wines/'.$wine->id, winePayload())->assertNotFound();
    $this->delete('/wines/'.$wine->id)->assertNotFound();
    $this->put('/racks/'.$rack->id, ['name' => 'Stolen', 'rows' => 1, 'columns' => 1])->assertNotFound();
    $this->delete('/racks/'.$rack->id)->assertNotFound();
    $this->patch('/bottles/'.$bottle->id.'/place', [])->assertNotFound();
    $this->post('/bottles/'.$bottle->id.'/consume')->assertNotFound();
    $this->delete('/bottles/'.$bottle->id)->assertNotFound();
    $this->post('/bottles', ['wine_id' => $wine->id])->assertSessionHasErrors('wine_id');
    expect(Gate::forUser($other)->allows('view', $wine))->toBeFalse();
    expect(Gate::forUser($owner)->allows('view', $wine))->toBeTrue();
});

it('searches grapes and filters stock without leaking other accounts', function () {
    $user = User::factory()->create();
    $wine = Wine::factory()->for($user)->create(['name' => 'Nebbiolo selection', 'vintage' => 2020]);
    $wine->grapes()->attach(Grape::factory()->create(['name' => 'Nebbiolo']));
    Bottle::factory()->for($wine)->create();
    Wine::factory()->for($user)->create(['name' => 'Empty wine']);
    Wine::factory()->create(['name' => 'Other private wine']);
    $this->actingAs($user)->get('/wines?q=Nebbiolo&type=red&vintage=2020')->assertInertia(fn (Assert $page) => $page->component('wines/index')->has('wines.data', 1)->where('wines.data.0.id', $wine->id));
    $this->get('/wines?stock=empty')->assertInertia(fn (Assert $page) => $page->has('wines.data', 1)->where('wines.data.0.name', 'Empty wine'));
});

it('validates domain values and ignores owner injection', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->post('/wines', winePayload(['type' => 'beer', 'body' => 'massive', 'vintage' => 1700, 'alcohol' => 99]))->assertSessionHasErrors(['type', 'body', 'vintage', 'alcohol']);
    $this->post('/wines', winePayload(['user_id' => 999, 'quantity' => 0]))->assertSessionHasNoErrors();
    $this->assertDatabaseHas('wines', ['user_id' => $user->id]);
});

it('stores reencoded private images and prevents cross-account reads', function () {
    Storage::fake('local');
    $user = User::factory()->create();
    $this->actingAs($user)->post('/wines', winePayload(['label' => UploadedFile::fake()->image('label.png', 3000, 1500)]))->assertSessionHasNoErrors();
    $wine = $user->wines()->first();
    Storage::disk('local')->assertExists($wine->label_path);
    $size = getimagesizefromstring(Storage::disk('local')->get($wine->label_path));
    expect($size[0])->toBe(2048);
    expect($size['mime'])->toBe('image/jpeg');
    $this->get('/wines/'.$wine->id.'/label')->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
    $this->actingAs(User::factory()->create())->get('/wines/'.$wine->id.'/label')->assertNotFound();
});

it('updates metadata without changing bottles and protects historical wines from deletion', function () {
    $wine = Wine::factory()->create();
    $bottle = Bottle::factory()->for($wine)->create();
    $this->actingAs($wine->user)->put('/wines/'.$wine->id, winePayload(['name' => 'Changed', 'body' => 'light']))->assertSessionHasNoErrors();
    expect($wine->fresh()->name)->toBe('Changed');
    expect($wine->bottles()->count())->toBe(1);
    $this->delete('/wines/'.$wine->id)->assertSessionHasErrors('wine');
});

it('reports inventory counts and filters history by wine and event', function () {
    $user = User::factory()->create();
    $rack = WineRack::factory()->for($user)->create(['rows' => 2, 'columns' => 3]);
    $this->actingAs($user)->post('/wines', winePayload())->assertSessionHasNoErrors();
    $wine = $user->wines()->first();
    $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('stats.bottles', 2)->where('stats.free', 6)->where('stats.unplaced', 2));
    $this->get('/activity?type=created&wine_id='.$wine->id)->assertInertia(fn (Assert $page) => $page->has('events.data', 2));
});
