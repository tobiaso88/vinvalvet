<?php

namespace App\Http\Controllers;

use App\Enums\BottleStatus;
use App\Http\Requests\BottleRequest;
use App\Models\Bottle;
use App\Models\Wine;
use App\Services\InventoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class BottleController extends Controller
{
    public function store(BottleRequest $request, InventoryService $inventory): RedirectResponse
    {
        $wine = Wine::findOrFail($request->integer('wine_id'));
        Gate::authorize('update', $wine);
        $positions = $request->filled('wine_rack_id') ? [$request->safe()->only('wine_rack_id', 'row', 'column')] : [];
        $inventory->add($wine, $request->integer('quantity', 1), $positions);

        return back()->with('success', 'Flaskorna har lagts till.');
    }

    public function place(BottleRequest $request, Bottle $bottle, InventoryService $inventory): RedirectResponse
    {
        Gate::authorize('update', $bottle);
        $inventory->place($bottle, $request->validated());

        return back()->with('success', 'Flaskans plats har uppdaterats.');
    }

    public function consume(Bottle $bottle, InventoryService $inventory): RedirectResponse
    {
        Gate::authorize('update', $bottle);
        $inventory->finish($bottle, BottleStatus::Consumed);

        return back()->with('success', 'Flaskan är markerad som konsumerad.');
    }

    public function destroy(Bottle $bottle, InventoryService $inventory): RedirectResponse
    {
        Gate::authorize('delete', $bottle);
        $inventory->finish($bottle, BottleStatus::Removed);

        return back()->with('success', 'Flaskan är borttagen ur lagret. Historiken finns kvar.');
    }
}
