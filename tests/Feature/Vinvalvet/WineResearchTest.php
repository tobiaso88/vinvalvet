<?php

namespace Tests\Feature\Vinvalvet;

use App\Enums\WineResearchStatus;
use App\Jobs\ResearchWine;
use App\Models\User;
use App\Models\Wine;
use App\Models\WineResearch;
use App\Services\OpenAiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class WineResearchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.openai.key' => 'fake-test-key']);
        Http::preventStrayRequests();
    }

    public function test_owner_can_queue_research_once_while_it_is_active(): void
    {
        $wine = Wine::factory()->create();
        Queue::fake([ResearchWine::class]);

        $this->actingAs($wine->user)->post('/wines/'.$wine->id.'/research')->assertRedirect();
        $this->post('/wines/'.$wine->id.'/research')->assertRedirect();

        $research = $wine->research()->firstOrFail();
        $this->assertSame(WineResearchStatus::Pending, $research->status);
        Queue::assertPushed(ResearchWine::class, 1);
    }

    public function test_research_endpoints_require_authentication(): void
    {
        $research = WineResearch::factory()->create();

        $this->post('/wines/'.$research->wine_id.'/research')->assertRedirect('/login');
        $this->post('/wine-research-batches')->assertRedirect('/login');
        $this->patch('/wine-researches/'.$research->id, ['fields' => ['producer']])->assertRedirect('/login');
    }

    public function test_foreign_user_cannot_start_or_apply_research(): void
    {
        $research = WineResearch::factory()->create();
        $other = User::factory()->create();

        $this->actingAs($other)->post('/wines/'.$research->wine_id.'/research')->assertNotFound();
        $this->patch('/wine-researches/'.$research->id, ['fields' => ['producer']])->assertNotFound();
    }

    public function test_bulk_start_queues_new_and_failed_research_only(): void
    {
        $user = User::factory()->create();
        $newWine = Wine::factory()->for($user)->create();
        $failedWine = Wine::factory()->for($user)->create();
        WineResearch::factory()->for($failedWine)->create(['status' => WineResearchStatus::Failed]);
        WineResearch::factory()->for(Wine::factory()->for($user))->create(['status' => WineResearchStatus::Completed]);
        WineResearch::factory()->for(Wine::factory()->for($user))->create(['status' => WineResearchStatus::Processing]);
        Wine::factory()->create();
        Queue::fake([ResearchWine::class]);

        $this->actingAs($user)->post('/wine-research-batches')->assertRedirect();

        $this->assertSame(WineResearchStatus::Pending, $newWine->research()->firstOrFail()->status);
        $this->assertSame(WineResearchStatus::Pending, $failedWine->research()->firstOrFail()->status);
        Queue::assertPushed(ResearchWine::class, 2);
    }

    public function test_selected_suggestions_fill_only_fields_that_are_still_empty(): void
    {
        $wine = Wine::factory()->create(['producer' => null, 'region' => null, 'body' => null, 'notes' => 'Min egen anteckning']);
        $research = WineResearch::factory()->for($wine)->create([
            'suggestions' => [
                'fields' => ['producer' => 'Researchproducent', 'region' => 'Piemonte', 'body' => 'full', 'grapes' => ['Nebbiolo']],
                'confidence' => [],
                'source_urls' => [],
            ],
        ]);
        $wine->update(['region' => 'Manuellt vald region']);

        $this->actingAs($wine->user)->patch('/wine-researches/'.$research->id, ['fields' => ['producer', 'region', 'body', 'grapes']])->assertRedirect();

        $wine->refresh()->load('grapes');
        $this->assertSame('Researchproducent', $wine->producer);
        $this->assertSame('Manuellt vald region', $wine->region);
        $this->assertSame('full', $wine->body->value);
        $this->assertSame('Min egen anteckning', $wine->notes);
        $this->assertSame(['Nebbiolo'], $wine->grapes->pluck('name')->all());
        $this->assertSame(['producer', 'body', 'grapes'], $research->fresh()->applied_fields);
    }

    public function test_job_stores_only_sourced_suggestions_and_exact_ratings(): void
    {
        $wine = Wine::factory()->create(['producer' => null, 'country' => 'Frankrike', 'body' => null, 'vintage' => 2020]);
        $research = WineResearch::factory()->for($wine)->create(['status' => WineResearchStatus::Pending]);
        $url = 'https://producer.example/wines/test-2020';
        Http::fake(['https://api.openai.com/v1/responses' => Http::response($this->researchResponse($url))]);

        (new ResearchWine($research->id))->handle(app(OpenAiService::class));

        $research->refresh();
        $this->assertSame(WineResearchStatus::Completed, $research->status);
        $this->assertSame('Verified producer', $research->suggestions['fields']['producer']);
        $this->assertNull($research->suggestions['fields']['country']);
        $this->assertNull($research->suggestions['fields']['body']);
        $this->assertCount(1, $research->ratings);
        $this->assertSame('Vivino', $research->ratings[0]['provider']);
        $this->assertSame($url, $research->sources[0]['url']);
        Http::assertSent(fn ($request): bool => $request['store'] === false
            && $request['tools'] === [['type' => 'web_search']]
            && $request['include'] === ['web_search_call.action.sources']
            && $request['text']['format']['strict'] === true);
    }

    public function test_job_marks_research_failed_when_openai_is_unavailable(): void
    {
        $research = WineResearch::factory()->create(['status' => WineResearchStatus::Pending, 'researched_at' => null]);
        Http::fake(['https://api.openai.com/v1/responses' => Http::failedConnection()]);

        try {
            (new ResearchWine($research->id))->handle(app(OpenAiService::class));
            $this->fail('A connection exception should have been thrown.');
        } catch (HttpException) {
            $research->refresh();
            $this->assertSame(WineResearchStatus::Failed, $research->status);
            $this->assertSame('Researchen kunde inte slutföras. Försök igen senare.', $research->error_message);
            $this->assertNull($research->researched_at);
        }
    }

    private function researchResponse(string $url): array
    {
        $fields = [
            'producer' => 'Verified producer',
            'vintage' => null,
            'country' => 'Italien',
            'region' => null,
            'ean' => null,
            'systembolaget_number' => null,
            'alcohol' => null,
            'body' => 'full',
            'grapes' => [],
        ];
        $result = [
            'fields' => $fields,
            'confidence' => array_fill_keys(array_keys($fields), 'high'),
            'source_urls' => [...array_fill_keys(array_keys($fields), []), 'producer' => [$url], 'country' => [$url]],
            'ratings' => [
                ['provider' => 'Vivino', 'score' => 4.2, 'scale' => 5, 'review_count' => 120, 'vintage' => 2020, 'url' => $url, 'exact_wine_match' => true, 'exact_vintage_match' => true],
                ['provider' => 'Unknown', 'score' => 99, 'scale' => 100, 'review_count' => 2, 'vintage' => 2020, 'url' => 'https://invented.example/rating', 'exact_wine_match' => true, 'exact_vintage_match' => true],
                ['provider' => 'Wrong vintage', 'score' => 4, 'scale' => 5, 'review_count' => 10, 'vintage' => 2019, 'url' => $url, 'exact_wine_match' => true, 'exact_vintage_match' => false],
            ],
            'warnings' => ['Kontrollera alltid uppgifterna.'],
        ];

        return [
            'status' => 'completed',
            'output' => [
                ['type' => 'web_search_call', 'action' => ['sources' => [['type' => 'url', 'title' => 'Producer page', 'url' => $url]]]],
                ['type' => 'message', 'content' => [['type' => 'output_text', 'text' => json_encode($result, JSON_THROW_ON_ERROR)]]],
            ],
        ];
    }

    #[DataProvider('upstreamFailures')]
    public function test_job_rejects_invalid_or_failed_openai_responses(string $mode): void
    {
        $research = WineResearch::factory()->create(['status' => WineResearchStatus::Pending]);
        $response = match ($mode) {
            'rate-limit' => Http::response([], 429),
            'server-error' => Http::response([], 500),
            'invalid-schema' => Http::response(['status' => 'completed', 'output' => [['type' => 'message', 'content' => [['type' => 'output_text', 'text' => json_encode(['fields' => []], JSON_THROW_ON_ERROR)]]]]]),
        };
        Http::fake(['https://api.openai.com/v1/responses' => $response]);

        try {
            (new ResearchWine($research->id))->handle(app(OpenAiService::class));
            $this->fail('An HTTP exception should have been thrown.');
        } catch (HttpException) {
            $this->assertSame(WineResearchStatus::Failed, $research->fresh()->status);
        }
    }

    public static function upstreamFailures(): array
    {
        return [
            'rate limit' => ['rate-limit'],
            'server error' => ['server-error'],
            'invalid schema' => ['invalid-schema'],
        ];
    }
}
