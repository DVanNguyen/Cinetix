<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AuthController extends Controller
{
    /**
     * ✅ Hiển thị form đăng nhập/đăng ký
     * Nhận intended URL từ query hoặc session
     */
    public function show(Request $request)
    {
        // Lấy intended URL từ nhiều nguồn (ưu tiên query > session > default)
        $intendedUrl = $request->query('intended') 
                    ?? $request->session()->get('url.intended')
                    ?? '/';

        return Inertia::render('Auth/AuthScreen', [
            'intended_url' => $intendedUrl
        ]);
    }

    /**
     * ✅ ĐĂNG KÝ - Với redirect về intended URL
     */
    public function register(Request $request)
    {
        // 1. Validate dữ liệu
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'phone' => 'required|string|max:15',
        ], [
            'email.unique' => 'Email này đã được đăng ký tài khoản khác.',
            'password.confirmed' => 'Mật khẩu xác nhận không trùng khớp.',
            'password.min' => 'Mật khẩu phải từ 6 ký tự trở lên.'
        ]);

        // 2. Tạo user mới
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'role' => 'customer'
        ]);

        // 3. Đăng nhập luôn
        Auth::login($user);

        // ✅ 4. Lấy intended URL và redirect
        $intendedUrl = $request->input('intended_url') 
                    ?? $request->session()->get('url.intended')
                    ?? '/';

        // Xóa intended URL khỏi session
        $request->session()->forget('url.intended');

        // Redirect về trang đích
        return redirect($intendedUrl)->with('success', 'Đăng ký thành công! Chào mừng bạn đến với CineTix.');
    }

    /**
     * ✅ ĐĂNG NHẬP - Với redirect về intended URL
     */
    public function login(Request $request)
    {
        // 1. Validate dữ liệu
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ], [
            'email.required' => 'Vui lòng nhập email.',
            'email.email' => 'Email không hợp lệ.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
        ]);

        // 2. Thử đăng nhập
        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $user = Auth::user();
            
            // Regenerate session để bảo mật
            $request->session()->regenerate();

            // ✅ Lấy intended URL
            $intendedUrl = $request->input('intended_url') 
                        ?? $request->session()->get('url.intended')
                        ?? '/';

            // Xóa intended URL khỏi session
            $request->session()->forget('url.intended');

            // Kiểm tra role và redirect phù hợp
            if ($user->role === 'admin') {
                // Admin luôn về dashboard, bỏ qua intended URL
                return redirect()->route('admin.dashboard')
                    ->with('success', 'Chào mừng Admin!');
            }

            // Customer redirect về intended URL hoặc home
            return redirect($intendedUrl)
                ->with('success', 'Đăng nhập thành công!');
        }

        // 3. Đăng nhập thất bại
        throw ValidationException::withMessages([
            'email' => 'Thông tin đăng nhập không chính xác (Sai email hoặc mật khẩu).',
        ]);
    }

    /**
     * ✅ ĐĂNG XUẤT
     */
    public function logout(Request $request)
    {
        Auth::logout();
        
        // Invalidate session
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        
        return redirect('/')->with('success', 'Đã đăng xuất thành công.');
    }

    /**
     * ✅ API: Kiểm tra trạng thái đăng nhập (Optional - cho AJAX)
     */
    public function checkAuth(Request $request)
    {
        if (Auth::check()) {
            return response()->json([
                'authenticated' => true,
                'user' => [
                    'id' => Auth::id(),
                    'name' => Auth::user()->name,
                    'email' => Auth::user()->email,
                    'role' => Auth::user()->role,
                ]
            ]);
        }

        return response()->json([
            'authenticated' => false
        ], 401);
    }

    /**
     * ✅ Xử lý khi user cố truy cập trang cần auth (middleware redirect)
     */
    public function redirectToLogin(Request $request)
    {
        // Lưu URL hiện tại vào session
        if (!$request->expectsJson()) {
            session(['url.intended' => $request->fullUrl()]);
        }

        return redirect()->route('login')
            ->with('info', 'Vui lòng đăng nhập để tiếp tục.');
    }
}