<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\ApplyBottleValuationController;
use App\Http\Controllers\ApplyWineResearchController;
use App\Http\Controllers\BottleController;
use App\Http\Controllers\BottleFinancialController;
use App\Http\Controllers\BottleValuationController;
use App\Http\Controllers\BottleValuationStatusController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PairingRecommendationController;
use App\Http\Controllers\WineController;
use App\Http\Controllers\WineRackController;
use App\Http\Controllers\WineResearchBatchController;
use App\Http\Controllers\WineResearchController;
use App\Http\Controllers\WineScanController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => auth()->check() ? to_route('dashboard') : to_route('login'))->name('home');
Route::middleware('auth')->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('wines/{wine}/label', [WineController::class, 'label'])->name('wines.label');
    Route::post('wines/{wine}/research', WineResearchController::class)->middleware('throttle:wine-research')->name('wines.research.store');
    Route::post('wine-research-batches', WineResearchBatchController::class)->middleware('throttle:wine-research-batches')->name('wine-research-batches.store');
    Route::patch('wine-researches/{wineResearch}', ApplyWineResearchController::class)->name('wine-researches.update');
    Route::resource('wines', WineController::class);
    Route::resource('racks', WineRackController::class)->except('create', 'edit');
    Route::post('bottles', [BottleController::class, 'store'])->name('bottles.store');
    Route::patch('bottles/{bottle}/financials', BottleFinancialController::class)->name('bottles.financials.update');
    Route::get('bottles/{bottle}/valuation', BottleValuationStatusController::class)->name('bottles.valuation.show');
    Route::post('bottles/{bottle}/valuation', BottleValuationController::class)->middleware('throttle:bottle-valuations')->name('bottles.valuation.store');
    Route::patch('bottle-valuations/{bottleValuation}', ApplyBottleValuationController::class)->name('bottle-valuations.update');
    Route::patch('bottles/{bottle}/place', [BottleController::class, 'place'])->name('bottles.place');
    Route::post('bottles/{bottle}/consume', [BottleController::class, 'consume'])->name('bottles.consume');
    Route::delete('bottles/{bottle}', [BottleController::class, 'destroy'])->name('bottles.destroy');
    Route::get('activity', ActivityController::class)->name('activity');
    Route::get('pairing', fn () => Inertia::render('pairing'))->name('pairing');
    Route::post('wine-scans', WineScanController::class)->middleware('throttle:wine-scans')->name('wine-scans');
    Route::post('pairing-recommendations', PairingRecommendationController::class)->middleware('throttle:pairing')->name('pairing-recommendations');
});
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
