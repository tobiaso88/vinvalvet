<?php

namespace App\Http\Controllers;

use App\Models\Bottle;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class BottleValuationStatusController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Bottle $bottle): JsonResponse
    {
        Gate::authorize('view', $bottle);
        $bottle->load('valuation');

        return response()->json([
            'purchase_price' => $bottle->purchase_price,
            'estimated_value' => $bottle->estimated_value,
            'valuation' => $bottle->valuation,
        ]);
    }
}
