<?php

namespace App\Http\Controllers;

use App\Enums\BottleEventType;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ActivityController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $filters = $request->validate(['type' => ['nullable', Rule::enum(BottleEventType::class)], 'wine_id' => ['nullable', 'integer'], 'from' => ['nullable', 'date_format:Y-m-d'], 'to' => ['nullable', 'date_format:Y-m-d']]);
        $query = $request->user()->bottleEvents()->with('bottle.wine', 'bottle.rack');
        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }
        if (! empty($filters['wine_id'])) {
            $query->whereHas('bottle', fn ($q) => $q->where('wine_id', $filters['wine_id']));
        }
        if (! empty($filters['from'])) {
            $query->whereDate('created_at', '>=', $filters['from']);
        }
        if (! empty($filters['to'])) {
            $query->whereDate('created_at', '<=', $filters['to']);
        }

        return Inertia::render('activity', ['events' => $query->latest('id')->paginate(25)->withQueryString(), 'filters' => $filters, 'wines' => $request->user()->wines()->orderBy('name')->get(['id', 'name', 'vintage'])]);
    }
}
