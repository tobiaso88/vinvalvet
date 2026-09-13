<?php

namespace App\Http\Controllers;

use App\Enums\BottleStatus;
use App\Http\Requests\PairingRequest;
use App\Services\OpenAiService;
use Illuminate\Http\JsonResponse;

class PairingRecommendationController extends Controller
{
    public function __invoke(PairingRequest $request, OpenAiService $ai): JsonResponse
    {
        $wines = $request->user()->wines()->whereHas('bottles', fn ($q) => $q->where('status', BottleStatus::Available))
            ->with('grapes')->orderBy('id')->get();
        if ($wines->isEmpty()) {
            return response()->json(['recommendations' => [], 'message' => 'Du har inga tillgängliga flaskor ännu. Lägg till vin i din samling först.']);
        }
        $inventory = $wines->map(fn ($wine) => [
            ...$wine->only('id', 'name', 'producer', 'vintage', 'type', 'country', 'region', 'alcohol', 'body'),
            'grapes' => $wine->grapes->pluck('name')->all(),
        ])->all();
        if (strlen(json_encode($inventory)) > 180000) {
            return response()->json(['message' => 'Samlingen är för stor för en analys just nu.'], 422);
        }
        $result = $ai->pair($request->validated('dish'), $inventory);
        $current = $request->user()->wines()->whereIn('id', array_column($result['recommendations'], 'wine_id'))
            ->with(['grapes', 'bottles' => fn ($q) => $q->where('status', BottleStatus::Available)->with('rack')->orderBy('id')])->get()->keyBy('id');
        $recommendations = [];
        foreach ($result['recommendations'] as $suggestion) {
            $wine = $current->get($suggestion['wine_id']);
            if ($wine && $wine->bottles->isNotEmpty()) {
                $recommendations[] = ['wine' => $wine, 'reason' => $suggestion['reason'], 'rank' => count($recommendations) + 1];
            }
        }

        return response()->json(['recommendations' => $recommendations, 'message' => $recommendations ? $result['message'] : 'Inget tillgängligt vin kunde rekommenderas till maträtten.']);
    }
}
