<?php

namespace App\Http\Controllers;

use App\Enums\BottleValuationStatus;
use App\Models\BottleValuation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class ApplyBottleValuationController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(BottleValuation $bottleValuation): JsonResponse
    {
        Gate::authorize('update', $bottleValuation->bottle);
        $value = DB::transaction(function () use ($bottleValuation): float {
            $valuation = BottleValuation::whereKey($bottleValuation->id)->lockForUpdate()->firstOrFail();
            if ($valuation->status !== BottleValuationStatus::Completed || $valuation->estimated_value === null) {
                throw ValidationException::withMessages(['valuation' => 'Värderingen måste vara färdig och verifierad innan den kan godkännas.']);
            }
            $bottle = $valuation->bottle()->lockForUpdate()->firstOrFail();
            $bottle->update(['estimated_value' => $valuation->estimated_value]);
            $valuation->update(['reviewed_at' => now()]);

            return $valuation->estimated_value;
        });

        return response()->json(['estimated_value' => $value]);
    }
}
