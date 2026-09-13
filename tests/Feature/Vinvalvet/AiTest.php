<?php

use App\Models\Bottle;
use App\Models\User;
use App\Models\Wine;
use App\Models\WineRack;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

function fakeAiResult(array $result): array
{
    return ['status' => 'completed', 'output' => [['type' => 'message', 'content' => [['type' => 'output_text', 'text' => json_encode($result)]]]]];
}
function scanResult(): array
{
    $fields = ['name' => 'Chablis', 'producer' => null, 'country' => 'Frankrike', 'region' => null, 'vintage' => 2022, 'alcohol' => null, 'type' => 'white', 'body' => null, 'grapes' => []];

    return ['fields' => $fields, 'confidence' => array_fill_keys(array_keys($fields), 'unknown'), 'warnings' => ['Kontrollera producenten.']];
}
beforeEach(function () {
    config(['services.openai.key' => 'fake-test-key']);
    Http::preventStrayRequests();
});

it('extracts an unsaved scan and sends structured private image input', function () {
    Storage::fake('local');
    Http::fake(['https://api.openai.com/v1/responses' => Http::response(fakeAiResult(scanResult()))]);
    $this->actingAs(User::factory()->create())->postJson('/wine-scans', ['label' => UploadedFile::fake()->image('label.jpg')])->assertOk()->assertJsonPath('fields.name', 'Chablis')->assertJsonPath('fields.producer', null);
    Http::assertSent(fn ($request) => $request['store'] === false && $request['text']['format']['strict'] === true && str_starts_with($request['input'][0]['content'][0]['image_url'], 'data:image/jpeg;base64,'));
    $this->assertDatabaseCount('wines', 0);
    expect(Storage::disk('local')->allFiles())->toBe([]);
});

it('only sends available owned wines and returns verified rack locations', function () {
    $wine = Wine::factory()->create(['name' => 'Owned wine']);
    $rack = WineRack::factory()->for($wine->user)->create(['name' => 'Källaren']);
    Bottle::factory()->for($wine)->create(['wine_rack_id' => $rack->id, 'row' => 2, 'column' => 3]);
    $empty = Wine::factory()->for($wine->user)->create(['name' => 'Consumed wine']);
    Bottle::factory()->for($empty)->create(['status' => 'consumed']);
    Bottle::factory()->create();
    Http::fake(['https://api.openai.com/v1/responses' => Http::response(fakeAiResult(['recommendations' => [['wine_id' => $wine->id, 'reason' => 'Passar till svamp.']], 'message' => 'Ett förslag.']))]);
    $this->actingAs($wine->user)->postJson('/pairing-recommendations', ['dish' => 'Svamprisotto'])->assertOk()->assertJsonPath('recommendations.0.wine.id', $wine->id)->assertJsonPath('recommendations.0.wine.bottles.0.location', 'Källaren · B3');
    Http::assertSent(function ($request) use ($wine) {
        $data = json_decode($request['input'][0]['content'], true);

        return count($data['inventory']) === 1 && $data['inventory'][0]['id'] === $wine->id && ! array_key_exists('label_url', $data['inventory'][0]) && $request['store'] === false;
    });
});

it('rejects a recommendation for a foreign or missing wine', function () {
    $wine = Wine::factory()->create();
    Bottle::factory()->for($wine)->create();
    Http::fake(['https://api.openai.com/v1/responses' => Http::response(fakeAiResult(['recommendations' => [['wine_id' => 999999, 'reason' => 'Invented']], 'message' => '']))]);
    $this->actingAs($wine->user)->postJson('/pairing-recommendations', ['dish' => 'Stekt fisk'])->assertStatus(502)->assertJsonPath('message', 'AI-tjänsten gav ett svar som inte kunde verifieras. Försök igen.');
    Http::assertSentCount(1);
});

it('rechecks availability after the AI call', function () {
    $bottle = Bottle::factory()->create();
    $wine = $bottle->wine;
    Http::fake(['https://api.openai.com/v1/responses' => function () use ($bottle, $wine) {
        $bottle->update(['status' => 'consumed']);

        return Http::response(fakeAiResult(['recommendations' => [['wine_id' => $wine->id, 'reason' => 'Passar.']], 'message' => 'Förslag']));
    }]);
    $this->actingAs($wine->user)->postJson('/pairing-recommendations', ['dish' => 'Pasta'])->assertOk()->assertJsonCount(0, 'recommendations');
    Http::assertSentCount(1);
});

it('handles an empty cellar without calling OpenAI', function () {
    Http::fake();
    $this->actingAs(User::factory()->create())->postJson('/pairing-recommendations', ['dish' => 'Pasta'])->assertOk()->assertJsonCount(0, 'recommendations');
    Http::assertNothingSent();
});

it('reports missing configuration while manual registration remains usable', function () {
    config(['services.openai.key' => null]);
    Http::fake();
    $this->actingAs(User::factory()->create())->postJson('/wine-scans', ['label' => UploadedFile::fake()->image('label.jpg')])->assertStatus(503);
    $this->post('/wines', winePayload(['quantity' => 0]))->assertSessionHasNoErrors();
    Http::assertNothingSent();
});

it('handles upstream failures without changing inventory', function ($mode, $status) {
    $fake = match ($mode) {
        'timeout' => Http::failedConnection(),
        'rate-limit' => Http::response([], 429),
        'server' => Http::response([], 500),
        'invalid' => Http::response(['status' => 'completed', 'output' => [['content' => [['type' => 'output_text', 'text' => 'not json']]]]]),
        'schema' => Http::response(fakeAiResult(['fields' => []])),
        'incomplete' => Http::response(['status' => 'incomplete']),
    };
    Http::fake(['https://api.openai.com/v1/responses' => $fake]);
    $this->actingAs(User::factory()->create())->postJson('/wine-scans', ['label' => UploadedFile::fake()->image('label.jpg')])->assertStatus($status);
    $this->assertDatabaseCount('wines', 0);
    Http::assertSentCount(1);
})->with([['timeout', 504], ['rate-limit', 429], ['server', 502], ['invalid', 502], ['schema', 502], ['incomplete', 502]]);

it('requires valid images and authenticated requests', function () {
    $this->postJson('/wine-scans')->assertUnauthorized();
    $this->postJson('/pairing-recommendations')->assertUnauthorized();
    $this->actingAs(User::factory()->create())->postJson('/wine-scans', ['label' => UploadedFile::fake()->create('script.svg', 2, 'image/svg+xml')])->assertUnprocessable();
    $this->postJson('/pairing-recommendations', ['dish' => ''])->assertUnprocessable();
    Http::assertNothingSent();
});

it('limits scans separately for each user', function () {
    Http::fake(['https://api.openai.com/v1/responses' => Http::response(fakeAiResult(scanResult()))]);
    $this->actingAs(User::factory()->create());
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/wine-scans', ['label' => UploadedFile::fake()->image('label.jpg')])->assertOk();
    }
    $this->postJson('/wine-scans', ['label' => UploadedFile::fake()->image('label.jpg')])->assertTooManyRequests();
    $this->actingAs(User::factory()->create())->postJson('/wine-scans', ['label' => UploadedFile::fake()->image('label.jpg')])->assertOk();
    Http::assertSentCount(6);
});
