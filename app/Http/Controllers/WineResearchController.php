<?php

namespace App\Http\Controllers;

use App\Enums\WineResearchStatus;
use App\Jobs\ResearchWine;
use App\Models\Wine;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class WineResearchController extends Controller
{
    public function __invoke(Wine $wine): RedirectResponse
    {
        Gate::authorize('update', $wine);
        $research = DB::transaction(function () use ($wine) {
            $lockedWine = Wine::whereKey($wine->id)->lockForUpdate()->firstOrFail();
            $research = $lockedWine->research()->firstOrNew();
            if ($research->exists && in_array($research->status, [WineResearchStatus::Pending, WineResearchStatus::Processing], true)) {
                return null;
            }
            $research->fill([
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
            ])->save();
            ResearchWine::dispatch($research->id);

            return $research;
        }, 3);
        if (! $research) {
            return back()->with('success', 'Research pågår redan för vinet.');
        }

        return back()->with('success', 'Vinresearchen har lagts i kön.');
    }
}
