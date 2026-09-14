<?php

namespace App\Jobs;

use App\Enums\BottleValuationStatus;
use App\Models\BottleValuation;
use App\Services\OpenAiService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class ValueBottle implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $timeout = 110;

    public int $tries = 1;

    public int $uniqueFor = 300;

    public bool $failOnTimeout = true;

    public function __construct(public int $valuationId)
    {
        $this->onConnection('wine-research');
        $this->afterCommit();
    }

    public function uniqueId(): string
    {
        return (string) $this->valuationId;
    }

    public function handle(OpenAiService $ai): void
    {
        $valuation = BottleValuation::with('bottle.wine.grapes')->find($this->valuationId);
        if (! $valuation || $valuation->status !== BottleValuationStatus::Pending) {
            return;
        }
        $valuation->update(['status' => BottleValuationStatus::Processing, 'error_message' => null]);
        $wine = $valuation->bottle->wine;
        $snapshot = [
            ...$wine->only('name', 'producer', 'vintage', 'type', 'country', 'region', 'ean', 'systembolaget_number', 'alcohol'),
            'type' => $wine->type->value,
            'grapes' => $wine->grapes->pluck('name')->all(),
            'bottle_volume_ml' => 750,
        ];

        try {
            $result = $ai->valueBottle($snapshot);
            $valuation->update([
                'status' => BottleValuationStatus::Completed,
                'input_snapshot' => $snapshot,
                ...$result,
                'error_message' => null,
                'valued_at' => now(),
            ]);
        } catch (Throwable $exception) {
            $valuation->update([
                'status' => BottleValuationStatus::Failed,
                'input_snapshot' => $snapshot,
                'error_message' => 'Värderingen kunde inte slutföras. Försök igen senare.',
            ]);
            throw $exception;
        }
    }
}
