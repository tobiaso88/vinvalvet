<?php

namespace App\Jobs;

use App\Models\Wine;
use App\Services\BottleImageService;
use App\Services\LabelImageService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class EnhanceBottleImage implements ShouldQueue
{
    use Queueable;

    public int $timeout = 150;

    public int $tries = 1;

    public bool $failOnTimeout = true;

    public function __construct(public int $wineId, public string $sourcePath)
    {
        $this->onConnection('bottle-images');
        $this->afterCommit();
    }

    /**
     * Execute the job.
     */
    public function handle(BottleImageService $service, LabelImageService $images): void
    {
        $wine = Wine::find($this->wineId);
        $disk = Storage::disk('local');
        if (! $wine || $wine->label_path !== $this->sourcePath || ! $disk->exists($this->sourcePath)) {
            return;
        }
        $jpeg = $images->encode(new UploadedFile($disk->path($this->sourcePath), basename($this->sourcePath), test: true));
        $png = $service->enhance($jpeg);
        $path = 'labels/'.$wine->user_id.'/'.Str::uuid().'.png';
        try {
            if (! $disk->put($path, $png)) {
                throw new RuntimeException('Could not store enhanced bottle image.');
            }
            $updated = Wine::whereKey($this->wineId)->where('label_path', $this->sourcePath)->update(['label_path' => $path]);
        } catch (Throwable $exception) {
            $disk->delete($path);
            throw $exception;
        }
        $disk->delete($updated ? $this->sourcePath : $path);
    }
}
