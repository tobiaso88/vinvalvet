<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateBottleFinancialsRequest;
use App\Models\Bottle;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class BottleFinancialController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(UpdateBottleFinancialsRequest $request, Bottle $bottle): JsonResponse
    {
        Gate::authorize('update', $bottle);
        $bottle->update(['purchase_price' => $request->validated('purchase_price')]);

        return response()->json(['purchase_price' => $bottle->purchase_price]);
    }
}
