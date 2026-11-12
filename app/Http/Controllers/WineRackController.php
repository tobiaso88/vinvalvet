<?php

namespace App\Http\Controllers;

use App\Enums\BottleStatus;
use App\Http\Requests\WineRackRequest;
use App\Models\Bottle;
use App\Models\WineRack;
use App\Services\InventoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class WineRackController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('racks/index', [
            'racks' => $request->user()->racks()->withCount('bottles')->orderBy('name')->get(),
            'unplacedCount' => Bottle::whereHas('wine', fn ($query) => $query->where('user_id', $request->user()->id))
                ->where('status', BottleStatus::Available)->whereNull('wine_rack_id')->count(),
        ]);
    }

    public function unplaced(Request $request): Response
    {
        return Inertia::render('racks/unplaced', [
            'racks' => $request->user()->racks()->with('bottles.wine', 'bottles.rack')->orderBy('name')->get(),
            'unplaced' => Bottle::whereHas('wine', fn ($query) => $query->where('user_id', $request->user()->id))
                ->where('status', BottleStatus::Available)->whereNull('wine_rack_id')->with('wine', 'rack')->orderBy('id')->get(),
        ]);
    }

    public function store(WineRackRequest $request): RedirectResponse
    {
        $rack = $request->user()->racks()->create($request->validated());

        return to_route('racks.show', $rack)->with('success', 'Hyllan har skapats.');
    }

    public function show(WineRack $rack, Request $request): Response
    {
        Gate::authorize('view', $rack);

        return Inertia::render('racks/show', [
            'rack' => $rack->load('bottles.wine', 'bottles.rack'),
            'racks' => $request->user()->racks()->with('bottles.wine', 'bottles.rack')->orderBy('name')->get(),
            'unplaced' => Bottle::whereHas('wine', fn ($q) => $q->where('user_id', $request->user()->id))
                ->where('status', BottleStatus::Available)->whereNull('wine_rack_id')->with('wine', 'rack')->orderBy('id')->get(),
        ]);
    }

    public function update(WineRackRequest $request, WineRack $rack, InventoryService $inventory): RedirectResponse
    {
        Gate::authorize('update', $rack);
        DB::transaction(function () use ($request, $rack, $inventory) {
            $inventory->lockOwner($request->user()->id);
            if ($rack->bottles()->where(fn ($q) => $q->where('row', '>', $request->integer('rows'))->orWhere('column', '>', $request->integer('columns')))->exists()) {
                throw ValidationException::withMessages(['rows' => 'Flytta först flaskorna som ligger utanför den nya storleken.']);
            }
            $rack->update($request->validated());
        });

        return back()->with('success', 'Hyllan har uppdaterats.');
    }

    public function destroy(WineRack $rack, InventoryService $inventory): RedirectResponse
    {
        Gate::authorize('delete', $rack);
        DB::transaction(function () use ($rack, $inventory) {
            $inventory->lockOwner($rack->user_id);
            if ($rack->bottles()->exists()) {
                throw ValidationException::withMessages(['rack' => 'Töm hyllan innan du raderar den.']);
            }
            $rack->delete();
        });

        return to_route('racks.index')->with('success', 'Hyllan har raderats.');
    }
}
