<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth; 

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // kiem tra dawng nhap
        if (!Auth::check()) {
            return redirect()->route('login')
                ->with('error', 'Vui lòng đăng nhập để tiếp tục.');
        }

        // Lấy user ra biến và khai báo kiểu (để IDE hiểu User này có cột 'role')
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Kiểm tra role
        if ($user->role !== 'admin') {
            abort(403, 'Bạn không có quyền truy cập trang này.');
        }

        return $next($request);
    }
}