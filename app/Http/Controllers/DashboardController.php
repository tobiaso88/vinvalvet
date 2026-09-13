<?php

namespace App\Http\Controllers;

use App\Enums\BottleStatus;
use App\Models\Bottle;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $racks = $user->racks()->withCount('bottles')->orderBy('name')->get();
        $available = Bottle::whereHas('wine', fn ($q) => $q->where('user_id', $user->id))->where('status', BottleStatus::Available);
        $capacity = $racks->sum(fn ($rack) => $rack->rows * $rack->columns);
        $occupied = $racks->sum('bottles_count');

        return Inertia::render('dashboard', [
            'stats' => ['bottles' => (clone $available)->count(), 'wines' => $user->wines()->count(),
                'capacity' => $capacity, 'occupied' => $occupied, 'free' => $capacity - $occupied,
                'unplaced' => (clone $available)->whereNull('wine_rack_id')->count()],
            'racks' => $racks,
            'events' => $user->bottleEvents()->with('bottle.wine', 'bottle.rack')->latest('id')->limit(5)->get(),
            'wines' => $user->wines()->with('grapes')->withCount(['bottles' => fn ($q) => $q->where('status', BottleStatus::Available)])->latest('id')->limit(4)->get(),
        ]);
    }
}
