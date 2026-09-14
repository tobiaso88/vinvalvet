<?php

namespace App\Http\Controllers;

use App\Enums\WineResearchStatus;
use App\Jobs\ResearchWine;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WineResearchBatchController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $count = DB::transaction(function () use ($request): int {
            $wines = $request->user()->wines()->with('research')->where(function ($query) {
                $query->whereDoesntHave('research')->orWhereHas('research', fn ($research) => $research->where('status', WineResearchStatus::Failed));
            })->orderBy('id')->lockForUpdate()->get();
            foreach ($wines as $wine) {
                $research = $wine->research()->updateOrCreate([], [
                    'status' => WineResearchStatus::Pending,
                    'input_snapshot' => null,
                    'suggestions' => null,
                    'ratings' => null,
                    'sources' => null,
                    'warnings' => null,
                    'applied_fields' => [],
                    'error_message' => null,
                    'researched_at' => null,
                    'reviewed_at' => null,
                ]);
                ResearchWine::dispatch($research->id);
            }

            return $wines->count();
        }, 3);

        return back()->with('success', $count === 0 ? 'Alla viner har redan research.' : $count.' vin har lagts i researchkön.');
    }
}
