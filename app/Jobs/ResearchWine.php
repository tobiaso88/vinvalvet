<?php

namespace App\Jobs;

use App\Enums\WineResearchStatus;
use App\Models\WineResearch;
use App\Services\OpenAiService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class ResearchWine implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $timeout = 110;

    public int $tries = 1;

    public int $uniqueFor = 300;

    public bool $failOnTimeout = true;

    public function __construct(public int $researchId)
    {
        $this->onConnection('wine-research');
        $this->afterCommit();
    }

    public function uniqueId(): string
    {
        return (string) $this->researchId;
    }

    public function handle(OpenAiService $ai): void
    {
        $research = WineResearch::with('wine.grapes')->find($this->researchId);
        if (! $research || $research->status !== WineResearchStatus::Pending) {
            return;
        }
        $research->update(['status' => WineResearchStatus::Processing, 'error_message' => null]);
        $wine = $research->wine;
        $snapshot = [
            ...$wine->only('name', 'producer', 'vintage', 'type', 'country', 'region', 'ean', 'systembolaget_number', 'alcohol', 'body'),
            'type' => $wine->type->value,
            'body' => $wine->body?->value,
            'grapes' => $wine->grapes->pluck('name')->all(),
        ];

        try {
            $result = $ai->research($snapshot);
            $research->update([
                'status' => WineResearchStatus::Completed,
                'input_snapshot' => $snapshot,
                ...$result,
                'error_message' => null,
                'researched_at' => now(),
            ]);
        } catch (Throwable $exception) {
            $research->update([
                'status' => WineResearchStatus::Failed,
                'input_snapshot' => $snapshot,
                'error_message' => 'Researchen kunde inte slutföras. Försök igen senare.',
            ]);
            throw $exception;
        }
    }
}
