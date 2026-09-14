<?php

namespace App\Http\Controllers;

use App\Models\Wine;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class WineValuationStatusController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Wine $wine): JsonResponse
    {
        Gate::authorize('view', $wine);
        $wine->load('valuation');

        return response()->json([
            'estimated_value' => $wine->estimated_value,
            'valuation' => $wine->valuation,
        ]);
    }
}
