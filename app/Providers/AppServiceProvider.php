<?php

namespace App\Providers;
use Carbon\Carbon;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

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
        Carbon::setLocale('vi');
        if($this->app->environment('production') || request()->server('HTTP_X_FORWARDED_PROTO') == 'https') {
        URL::forceScheme('https');
        }
    }
}
