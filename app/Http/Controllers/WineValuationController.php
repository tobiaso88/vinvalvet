<?php

namespace App\Http\Controllers;

use App\Enums\WineValuationStatus;
use App\Jobs\ValueWine;
use App\Models\Wine;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class WineValuationController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Wine $wine): JsonResponse
    {
        Gate::authorize('update', $wine);
        $valuation = DB::transaction(function () use ($wine) {
            $lockedWine = Wine::whereKey($wine->id)->lockForUpdate()->firstOrFail();
            $valuation = $lockedWine->valuation()->firstOrNew();
            if ($valuation->exists && in_array($valuation->status, [WineValuationStatus::Pending, WineValuationStatus::Processing], true)) {
                return $valuation;
            }
            $valuation->fill([
                'status' => WineValuationStatus::Pending,
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
            ValueWine::dispatch($valuation->id);

            return $valuation;
        }, 3);

        return response()->json(['valuation' => $valuation], 202);
    }
}
