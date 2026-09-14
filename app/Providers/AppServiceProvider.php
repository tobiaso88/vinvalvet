<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('wine-scans', fn (Request $request) => Limit::perMinute(5)->by($request->user()->id));
        RateLimiter::for('pairing', fn (Request $request) => Limit::perMinute(10)->by($request->user()->id));
        RateLimiter::for('wine-research', fn (Request $request) => Limit::perMinute(10)->by($request->user()->id));
        RateLimiter::for('wine-research-batches', fn (Request $request) => Limit::perMinute(2)->by($request->user()->id));
        RateLimiter::for('bottle-valuations', fn (Request $request) => Limit::perMinute(10)->by($request->user()->id));
        //
    }
}
