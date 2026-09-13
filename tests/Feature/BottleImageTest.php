<?php

namespace Tests\Feature;

use App\Jobs\EnhanceBottleImage;
use App\Models\User;
use App\Models\Wine;
use App\Services\BottleImageService;
use App\Services\LabelImageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class BottleImageTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_private_png_without_saving_and_sends_edit_parameters(): void
    {
        config(['services.openai.key' => 'test']);
        Storage::fake('local');
        Http::preventStrayRequests();
        Http::fake(['https://api.openai.com/v1/images/edits' => Http::response(['data' => [['b64_json' => base64_encode($this->png())]]])]);

        $png = (new BottleImageService)->enhance((new LabelImageService)->encode(UploadedFile::fake()->image('bottle.jpg')));
        $this->assertSame('image/png', getimagesizefromstring($png)['mime']);
        $this->assertSame([], Storage::disk('local')->allFiles());
        Http::assertSent(function ($request): bool {
            $data = collect($request->data())->pluck('contents', 'name');

            return $request->isMultipart() && $data['model'] === 'gpt-image-2.5-sunburst' && $data['quality'] === 'high' && $data['size'] === '1024x1536' && $data['background'] === 'transparent' && $data['output_format'] === 'png' && str_contains($data['prompt'], 'all visible text') && getimagesizefromstring($data['image'])['mime'] === 'image/jpeg';
        });
        Http::assertSentCount(1);
    }

    #[DataProvider('failures')]
    public function test_reports_failures_without_retry(string $mode, int $status): void
    {
        config(['services.openai.key' => $mode === 'missing' ? null : 'test']);
        Http::preventStrayRequests();
        Http::fake(['https://api.openai.com/v1/images/edits' => match ($mode) {
            'timeout' => Http::failedConnection(),
            'rate' => Http::response([], 429),
            'server' => Http::response([], 500),
            'invalid' => Http::response(['data' => [['b64_json' => '%%%']]]),
            default => Http::response(['data' => [['b64_json' => base64_encode('not png')]]]),
        }]);

        try {
            (new BottleImageService)->enhance('jpeg');
            $this->fail('Expected an image service error.');
        } catch (HttpException $exception) {
            $this->assertSame($status, $exception->getStatusCode());
        }
        Http::assertSentCount($mode === 'missing' ? 0 : 1);
    }

    public static function failures(): array
    {
        return [['missing', 503], ['timeout', 504], ['rate', 429], ['server', 502], ['invalid', 502], ['not-png', 502]];
    }

    public function test_saving_dispatches_a_job_without_calling_openai(): void
    {
        Queue::fake();
        Storage::fake('local');
        Http::preventStrayRequests();
        $user = User::factory()->create();
        $this->actingAs($user)->post('/wines', ['name' => 'Vin', 'type' => 'red', 'quantity' => 0, 'grapes' => [], 'label' => UploadedFile::fake()->image('bottle.jpg')])->assertSessionHasNoErrors();
        $wine = $user->wines()->firstOrFail();
        Queue::assertPushed(EnhanceBottleImage::class, fn ($job) => $job->wineId === $wine->id && $job->sourcePath === $wine->label_path && $job->connection === 'bottle-images');
        Http::assertNothingSent();
    }

    public function test_job_replaces_the_original_and_ignores_duplicate_delivery(): void
    {
        Storage::fake('local');
        config(['services.openai.key' => 'test']);
        Http::preventStrayRequests();
        Http::fake(['https://api.openai.com/v1/images/edits' => Http::response(['data' => [['b64_json' => base64_encode($this->png())]]])]);
        $wine = Wine::factory()->create();
        $path = (new LabelImageService)->store(UploadedFile::fake()->image('bottle.jpg'), $wine->user_id);
        $wine->label_path = $path;
        $wine->save();
        $job = new EnhanceBottleImage($wine->id, $path);
        $job->handle(new BottleImageService, new LabelImageService);
        $newPath = $wine->fresh()->label_path;
        $this->assertNotSame($path, $newPath);
        Storage::disk('local')->assertMissing($path);
        Storage::disk('local')->assertExists($newPath);
        $job->handle(new BottleImageService, new LabelImageService);
        Http::assertSentCount(1);
    }

    public function test_a_newer_image_is_not_overwritten_during_processing(): void
    {
        Storage::fake('local');
        config(['services.openai.key' => 'test']);
        $wine = Wine::factory()->create();
        $path = (new LabelImageService)->store(UploadedFile::fake()->image('old.jpg'), $wine->user_id);
        $wine->label_path = $path;
        $wine->save();
        Http::preventStrayRequests();
        Http::fake(['https://api.openai.com/v1/images/edits' => function () use ($wine) {
            $wine->label_path = 'new.jpg';
            $wine->save();

            return Http::response(['data' => [['b64_json' => base64_encode($this->png())]]]);
        }]);
        (new EnhanceBottleImage($wine->id, $path))->handle(new BottleImageService, new LabelImageService);
        $this->assertSame('new.jpg', $wine->fresh()->label_path);
        $this->assertSame([$path], Storage::disk('local')->allFiles());
    }

    public function test_job_failure_keeps_the_original_and_deleted_wines_are_skipped(): void
    {
        Storage::fake('local');
        config(['services.openai.key' => 'test']);
        Http::preventStrayRequests();
        Http::fake(['https://api.openai.com/v1/images/edits' => Http::response([], 500)]);
        $wine = Wine::factory()->create();
        $path = (new LabelImageService)->store(UploadedFile::fake()->image('bottle.jpg'), $wine->user_id);
        $wine->label_path = $path;
        $wine->save();
        $job = new EnhanceBottleImage($wine->id, $path);
        try {
            $job->handle(new BottleImageService, new LabelImageService);
            $this->fail('Expected failed enhancement.');
        } catch (HttpException $exception) {
            $this->assertSame(502, $exception->getStatusCode());
        }
        $this->assertSame($path, $wine->fresh()->label_path);
        Storage::disk('local')->assertExists($path);
        $wine->delete();
        $job->handle(new BottleImageService, new LabelImageService);
        Http::assertSentCount(1);
    }

    public function test_preserves_transparency_in_private_storage(): void
    {
        Storage::fake('local');
        $path = (new LabelImageService)->store(UploadedFile::fake()->createWithContent('bottle.png', $this->png()), 1);
        Storage::disk('local')->assertExists($path);
        $image = imagecreatefromstring(Storage::disk('local')->get($path));
        $this->assertSame(127, imagecolorsforindex($image, imagecolorat($image, 0, 0))['alpha']);
    }

    public function test_private_image_can_be_replaced_and_deleted(): void
    {
        Queue::fake();
        Storage::fake('local');
        $user = User::factory()->create();
        $payload = ['name' => 'Testvin', 'type' => 'red', 'quantity' => 0, 'grapes' => []];
        $this->actingAs($user)->post('/wines', [...$payload, 'label' => UploadedFile::fake()->createWithContent('bottle.png', $this->png())])->assertSessionHasNoErrors();
        $wine = $user->wines()->firstOrFail();
        $oldPath = $wine->label_path;
        $this->get('/wines/'.$wine->id.'/label')->assertOk()->assertHeader('Content-Type', 'image/png');
        $this->actingAs(User::factory()->create())->get('/wines/'.$wine->id.'/label')->assertNotFound();

        $this->actingAs($user)->post('/wines/'.$wine->id, [...$payload, '_method' => 'put', 'label' => UploadedFile::fake()->image('replacement.jpg')])->assertSessionHasNoErrors();
        Storage::disk('local')->assertMissing($oldPath);
        $newPath = $wine->fresh()->label_path;
        Storage::disk('local')->assertExists($newPath);

        $this->delete('/wines/'.$wine->id)->assertSessionHasNoErrors();
        Storage::disk('local')->assertMissing($newPath);
    }

    private function png(): string
    {
        $image = imagecreatetruecolor(2, 2);
        imagealphablending($image, false);
        imagesavealpha($image, true);
        imagefill($image, 0, 0, imagecolorallocatealpha($image, 0, 0, 0, 127));
        ob_start();
        imagepng($image);

        return (string) ob_get_clean();
    }
}
