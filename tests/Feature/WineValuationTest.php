<?php

namespace Tests\Feature;

use App\Enums\BottleStatus;
use App\Enums\WineValuationStatus;
use App\Jobs\ValueWine;
use App\Models\Bottle;
use App\Models\User;
use App\Models\Wine;
use App\Models\WineValuation;
use App\Services\OpenAiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class WineValuationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.openai.key' => 'fake-test-key']);
        Http::preventStrayRequests();
    }

    public function test_owner_can_save_a_purchase_price_on_one_bottle(): void
    {
        $bottle = Bottle::factory()->create();
        $otherBottle = Bottle::factory()->for($bottle->wine)->create();

        $this->actingAs($bottle->wine->user)->patchJson('/bottles/'.$bottle->id.'/financials', ['purchase_price' => 249.50])
            ->assertOk()->assertJson(['purchase_price' => 249.5, 'updated_count' => 1]);

        $this->assertSame(249.5, $bottle->fresh()->purchase_price);
        $this->assertNull($otherBottle->fresh()->purchase_price);
    }

    public function test_owner_can_apply_a_purchase_price_to_all_available_bottles_of_the_wine(): void
    {
        $wine = Wine::factory()->create();
        $bottle = Bottle::factory()->for($wine)->create();
        $otherAvailableBottle = Bottle::factory()->for($wine)->create();
        $consumedBottle = Bottle::factory()->for($wine)->create(['status' => BottleStatus::Consumed, 'purchase_price' => 100]);
        $otherWineBottle = Bottle::factory()->create(['purchase_price' => 200]);

        $this->actingAs($wine->user)->patchJson('/bottles/'.$bottle->id.'/financials', [
            'purchase_price' => 349.50,
            'apply_to_available_wine_bottles' => true,
        ])->assertOk()->assertJson(['purchase_price' => 349.5, 'updated_count' => 2]);

        $this->assertSame(349.5, $bottle->fresh()->purchase_price);
        $this->assertSame(349.5, $otherAvailableBottle->fresh()->purchase_price);
        $this->assertSame(100.0, $consumedBottle->fresh()->purchase_price);
        $this->assertSame(200.0, $otherWineBottle->fresh()->purchase_price);
    }

    public function test_financial_and_valuation_endpoints_are_private(): void
    {
        $valuation = WineValuation::factory()->create();
        $wine = $valuation->wine;
        $bottle = Bottle::factory()->for($wine)->create();

        $this->getJson('/wines/'.$wine->id.'/valuation')->assertUnauthorized();
        $this->postJson('/wines/'.$wine->id.'/valuation')->assertUnauthorized();
        $this->patchJson('/bottles/'.$bottle->id.'/financials', ['purchase_price' => 100])->assertUnauthorized();
        $this->patchJson('/wine-valuations/'.$valuation->id)->assertUnauthorized();

        $other = User::factory()->create();
        $this->actingAs($other)->getJson('/wines/'.$wine->id.'/valuation')->assertNotFound();
        $this->postJson('/wines/'.$wine->id.'/valuation')->assertNotFound();
        $this->patchJson('/bottles/'.$bottle->id.'/financials', ['purchase_price' => 100])->assertNotFound();
        $this->patchJson('/wine-valuations/'.$valuation->id)->assertNotFound();
    }

    public function test_owner_can_queue_only_one_active_valuation_for_a_wine(): void
    {
        $wine = Wine::factory()->create();
        Queue::fake([ValueWine::class]);

        $this->actingAs($wine->user)->postJson('/wines/'.$wine->id.'/valuation')->assertAccepted();
        $this->postJson('/wines/'.$wine->id.'/valuation')->assertAccepted();

        $this->assertSame(WineValuationStatus::Pending, $wine->valuation()->firstOrFail()->status);
        Queue::assertPushed(ValueWine::class, 1);
    }

    public function test_completed_verified_valuation_can_be_applied_to_the_wine(): void
    {
        $valuation = WineValuation::factory()->create(['estimated_value' => 1399.50, 'reviewed_at' => null]);

        $this->actingAs($valuation->wine->user)->patchJson('/wine-valuations/'.$valuation->id)
            ->assertOk()->assertJson(['estimated_value' => 1399.5]);

        $this->assertSame(1399.5, $valuation->wine->fresh()->estimated_value);
        $this->assertNotNull($valuation->fresh()->reviewed_at);
    }

    public function test_job_stores_a_value_only_from_returned_sources_for_the_exact_vintage(): void
    {
        $wine = Wine::factory()->create(['vintage' => 2020]);
        $valuation = WineValuation::factory()->for($wine)->create([
            'status' => WineValuationStatus::Pending,
            'estimated_value' => null,
            'valued_at' => null,
        ]);
        $url = 'https://merchant.example/wine-2020';
        Http::fake(['https://api.openai.com/v1/responses' => Http::response($this->valuationResponse($url))]);

        (new ValueWine($valuation->id))->handle(app(OpenAiService::class));

        $valuation->refresh();
        $this->assertSame(WineValuationStatus::Completed, $valuation->status);
        $this->assertSame(875.0, $valuation->estimated_value);
        $this->assertSame($url, $valuation->sources[0]['url']);
        $this->assertSame(750, $valuation->input_snapshot['bottle_volume_ml']);
        Http::assertSent(fn ($request): bool => $request['store'] === false
            && $request['tools'] === [['type' => 'web_search']]
            && $request['text']['format']['name'] === 'bottle_valuation'
            && $request['text']['format']['strict'] === true);
    }

    public function test_job_discards_a_value_when_the_vintage_or_source_cannot_be_verified(): void
    {
        $wine = Wine::factory()->create(['vintage' => 2020]);
        $valuation = WineValuation::factory()->for($wine)->create(['status' => WineValuationStatus::Pending]);
        $url = 'https://merchant.example/wine-2020';
        $response = $this->valuationResponse($url);
        $result = json_decode($response['output'][1]['content'][0]['text'], true, 512, JSON_THROW_ON_ERROR);
        $result['exact_vintage_match'] = false;
        $result['source_urls'] = ['https://invented.example/wine'];
        $response['output'][1]['content'][0]['text'] = json_encode($result, JSON_THROW_ON_ERROR);
        Http::fake(['https://api.openai.com/v1/responses' => Http::response($response)]);

        (new ValueWine($valuation->id))->handle(app(OpenAiService::class));

        $this->assertNull($valuation->fresh()->estimated_value);
        $this->assertSame([], $valuation->fresh()->sources);
    }

    public function test_job_marks_the_valuation_failed_without_changing_the_wine(): void
    {
        $valuation = WineValuation::factory()->create(['status' => WineValuationStatus::Pending]);
        $valuation->wine->update(['estimated_value' => 500]);
        Http::fake(['https://api.openai.com/v1/responses' => Http::failedConnection()]);

        try {
            (new ValueWine($valuation->id))->handle(app(OpenAiService::class));
            $this->fail('A connection exception should have been thrown.');
        } catch (HttpException) {
            $this->assertSame(WineValuationStatus::Failed, $valuation->fresh()->status);
            $this->assertSame(500.0, $valuation->wine->fresh()->estimated_value);
        }
    }

    private function valuationResponse(string $url): array
    {
        $result = [
            'estimated_value' => 875,
            'currency' => 'SEK',
            'basis' => 'Aktuellt pris hos en handlare.',
            'source_urls' => [$url],
            'exact_wine_match' => true,
            'exact_vintage_match' => true,
            'warnings' => ['Skick och lagringshistorik kan påverka värdet.'],
        ];

        return [
            'status' => 'completed',
            'output' => [
                ['type' => 'web_search_call', 'action' => ['sources' => [['type' => 'url', 'title' => 'Merchant', 'url' => $url]]]],
                ['type' => 'message', 'content' => [['type' => 'output_text', 'text' => json_encode($result, JSON_THROW_ON_ERROR)]]],
            ],
        ];
    }
}
