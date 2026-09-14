<?php

namespace App\Http\Controllers;

use App\Enums\WineValuationStatus;
use App\Models\WineValuation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class ApplyWineValuationController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(WineValuation $wineValuation): JsonResponse
    {
        Gate::authorize('update', $wineValuation->wine);
        $value = DB::transaction(function () use ($wineValuation): float {
            $valuation = WineValuation::whereKey($wineValuation->id)->lockForUpdate()->firstOrFail();
            if ($valuation->status !== WineValuationStatus::Completed || $valuation->estimated_value === null) {
                throw ValidationException::withMessages(['valuation' => 'Värderingen måste vara färdig och verifierad innan den kan godkännas.']);
            }
            $wine = $valuation->wine()->lockForUpdate()->firstOrFail();
            $wine->update(['estimated_value' => $valuation->estimated_value]);
            $valuation->update(['reviewed_at' => now()]);

            return $valuation->estimated_value;
        });

        return response()->json(['estimated_value' => $value]);
    }
}
