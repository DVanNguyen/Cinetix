<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // Nếu request là API (JSON) thì trả về null (lỗi 401)
        // Nếu truy cập bình thường thì chuyển về route 'login'
        return $request->expectsJson() ? null : route('login');
    }
}