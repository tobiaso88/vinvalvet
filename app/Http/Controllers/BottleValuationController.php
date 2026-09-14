<?php

namespace App\Http\Controllers;

use App\Enums\BottleValuationStatus;
use App\Jobs\ValueBottle;
use App\Models\Bottle;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class BottleValuationController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Bottle $bottle): JsonResponse
    {
        Gate::authorize('update', $bottle);
        $valuation = DB::transaction(function () use ($bottle) {
            $lockedBottle = Bottle::whereKey($bottle->id)->lockForUpdate()->firstOrFail();
            $valuation = $lockedBottle->valuation()->firstOrNew();
            if ($valuation->exists && in_array($valuation->status, [BottleValuationStatus::Pending, BottleValuationStatus::Processing], true)) {
                return $valuation;
            }
            $valuation->fill([
                'status' => BottleValuationStatus::Pending,
                'input_snapshot' => null,
                'estimated_value' => null,
                'currency' => 'SEK',
                'basis' => null,
                'sources' => null,
                'warnings' => null,
                'error_message' => null,
                'valued_at' => null,
                'reviewed_at' => null,
            ])->save();
            ValueBottle::dispatch($valuation->id);

            return $valuation;
        }, 3);

        return response()->json(['valuation' => $valuation], 202);
    }
}
