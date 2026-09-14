<?php

namespace App\Http\Controllers;

use App\Enums\BottleStatus;
use App\Enums\WineResearchStatus;
use App\Http\Requests\WineRequest;
use App\Jobs\EnhanceBottleImage;
use App\Models\Grape;
use App\Models\Wine;
use App\Services\InventoryService;
use App\Services\LabelImageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class WineController extends Controller
{
    public function index(Request $request): Response
    {
        $query = $request->user()->wines()->with(['research', 'grapes', 'bottles' => fn ($q) => $q->where('status', BottleStatus::Available)->with('rack')]);
        if ($request->filled('q')) {
            $term = '%'.mb_substr($request->string('q')->toString(), 0, 255).'%';
            $query->where(function ($q) use ($term) {
                foreach (['name', 'producer', 'country', 'region', 'ean', 'systembolaget_number'] as $field) {
                    $q->orWhere($field, 'like', $term);
                }
                $q->orWhereHas('grapes', fn ($g) => $g->where('name', 'like', $term));
            });
        }
        foreach (['type', 'body', 'vintage'] as $field) {
            if ($request->filled($field)) {
                if ($field === 'vintage' && $request->input($field) === 'nv') {
                    $query->whereNull('vintage');
                } else {
                    $query->where($field, $request->input($field));
                }
            }
        }
        if ($request->input('stock', 'available') === 'available') {
            $query->whereHas('bottles', fn ($q) => $q->where('status', BottleStatus::Available));
        } elseif ($request->input('stock') === 'empty') {
            $query->whereDoesntHave('bottles', fn ($q) => $q->where('status', BottleStatus::Available));
        }

        return Inertia::render('wines/index', [
            'wines' => $query->orderBy('name')->orderBy('id')->paginate(18)->withQueryString(),
            'filters' => array_merge(['stock' => 'available'], $request->only('q', 'type', 'body', 'vintage', 'stock')),
            'researchProgress' => [
                'pending' => $request->user()->wines()->whereHas('research', fn ($research) => $research->where('status', WineResearchStatus::Pending))->count(),
                'processing' => $request->user()->wines()->whereHas('research', fn ($research) => $research->where('status', WineResearchStatus::Processing))->count(),
                'completed' => $request->user()->wines()->whereHas('research', fn ($research) => $research->where('status', WineResearchStatus::Completed))->count(),
                'failed' => $request->user()->wines()->whereHas('research', fn ($research) => $research->where('status', WineResearchStatus::Failed))->count(),
                'eligible' => $request->user()->wines()->where(function ($wines) {
                    $wines->whereDoesntHave('research')->orWhereHas('research', fn ($research) => $research->where('status', WineResearchStatus::Failed));
                })->count(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('wines/form', ['wine' => null, 'racks' => $request->user()->racks()->with('bottles.rack', 'bottles.wine')->orderBy('name')->get()]);
    }

    public function store(WineRequest $request, InventoryService $inventory, LabelImageService $images): RedirectResponse
    {
        $path = $request->hasFile('label') ? $images->store($request->file('label'), $request->user()->id) : null;
        try {
            $wine = DB::transaction(function () use ($request, $inventory, $path) {
                $inventory->lockOwner($request->user()->id);
                $wine = $request->user()->wines()->make($request->safe()->except('grapes', 'quantity', 'positions', 'label'));
                $wine->label_path = $path;
                $wine->save();
                $this->syncGrapes($wine, $request->validated('grapes'));
                $inventory->add($wine, $request->integer('quantity'), $request->validated('positions', []));

                return $wine;
            }, 3);
        } catch (Throwable $exception) {
            if ($path) {
                Storage::disk('local')->delete($path);
            }
            throw $exception;
        }

        if ($path) {
            $this->enhanceImage($wine, $path);
        }

        return to_route('wines.show', $wine)->with('success', 'Vinet har lagts till i din samling.'.($path ? ' Bilden förbättras i bakgrunden.' : ''));
    }

    public function show(Wine $wine, Request $request): Response
    {
        Gate::authorize('view', $wine);

        return Inertia::render('wines/show', [
            'wine' => $wine->load('research', 'grapes', 'bottles.rack', 'bottles.valuation'),
            'racks' => $request->user()->racks()->with('bottles.rack', 'bottles.wine', 'bottles.valuation')->orderBy('name')->get(),
        ]);
    }

    public function edit(Wine $wine): Response
    {
        Gate::authorize('update', $wine);

        return Inertia::render('wines/form', ['wine' => $wine->load('grapes'), 'racks' => []]);
    }

    public function update(WineRequest $request, Wine $wine, InventoryService $inventory, LabelImageService $images): RedirectResponse
    {
        Gate::authorize('update', $wine);
        $path = $request->hasFile('label') ? $images->store($request->file('label'), $request->user()->id) : null;
        $oldPath = $wine->label_path;
        try {
            DB::transaction(function () use ($request, $wine, $inventory, $path) {
                $inventory->lockOwner($request->user()->id);
                $wine->fill($request->safe()->except('grapes', 'quantity', 'positions', 'label'));
                if ($path) {
                    $wine->label_path = $path;
                }
                $wine->save();
                $this->syncGrapes($wine, $request->validated('grapes'));
            });
        } catch (Throwable $exception) {
            if ($path) {
                Storage::disk('local')->delete($path);
            }
            throw $exception;
        }
        if ($path && $oldPath) {
            Storage::disk('local')->delete($oldPath);
        }

        if ($path) {
            $this->enhanceImage($wine, $path);
        }

        return to_route('wines.show', $wine)->with('success', 'Vinuppgifterna har sparats.'.($path ? ' Bilden förbättras i bakgrunden.' : ''));
    }

    public function destroy(Wine $wine, InventoryService $inventory): RedirectResponse
    {
        Gate::authorize('delete', $wine);
        DB::transaction(function () use ($wine, $inventory) {
            $inventory->lockOwner($wine->user_id);
            if ($wine->bottles()->exists()) {
                throw ValidationException::withMessages(['wine' => 'Vin med flaskor eller historik kan inte raderas. Markera flaskorna som borttagna i stället.']);
            }
            $wine->delete();
        });
        if ($wine->label_path) {
            Storage::disk('local')->delete($wine->label_path);
        }

        return to_route('wines.index')->with('success', 'Vinposten har raderats.');
    }

    public function label(Wine $wine): StreamedResponse
    {
        Gate::authorize('view', $wine);
        abort_unless($wine->label_path && Storage::disk('local')->exists($wine->label_path), 404);

        return Storage::disk('local')->response($wine->label_path, null, ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }

    private function enhanceImage(Wine $wine, string $path): void
    {
        try {
            EnhanceBottleImage::dispatch($wine->id, $path);
        } catch (Throwable $exception) {
            report($exception);
        }
    }

    private function syncGrapes(Wine $wine, array $names): void
    {
        $wine->grapes()->sync(collect($names)->map(fn (string $name) => Grape::firstOrCreate(['name' => trim($name)])->id)->unique()->all());
    }
}
