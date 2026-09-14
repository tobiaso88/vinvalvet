<?php

namespace App\Http\Controllers;

use App\Enums\BottleStatus;
use App\Http\Requests\UpdateBottleFinancialsRequest;
use App\Models\Bottle;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class BottleFinancialController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(UpdateBottleFinancialsRequest $request, Bottle $bottle): JsonResponse
    {
        Gate::authorize('update', $bottle);
        $updatedCount = DB::transaction(function () use ($request, $bottle): int {
            $lockedBottle = Bottle::with('wine')->whereKey($bottle->id)->lockForUpdate()->firstOrFail();
            $query = $request->boolean('apply_to_available_wine_bottles')
                ? $lockedBottle->wine->bottles()->where('status', BottleStatus::Available)
                : Bottle::whereKey($lockedBottle->id);
            $updatedCount = (clone $query)->count();
            $query->update(['purchase_price' => $request->validated('purchase_price')]);

            return $updatedCount;
        }, 3);

        $bottle->refresh();

        return response()->json(['purchase_price' => $bottle->purchase_price, 'updated_count' => $updatedCount]);
    }
}
