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
    // Hiển thị form
    public function show()
    {
        return Inertia::render('Auth/AuthScreen');
    }

    // --- LOGIC ĐĂNG KÝ (INSERT VÀO CSDL) ---
    public function register(Request $request)
    {
        // 1. Validate: Kiểm tra dữ liệu đầu vào
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users', // unique:users -> Kiểm tra email đã tồn tại trong bảng users chưa
            'password' => 'required|string|min:6|confirmed', // confirmed -> Phải khớp với password_confirmation
            'phone' => 'required|string|max:15',
        ], [
            'email.unique' => 'Email này đã được đăng ký tài khoản khác.',
            'password.confirmed' => 'Mật khẩu xác nhận không trùng khớp.',
            'password.min' => 'Mật khẩu phải từ 6 ký tự trở lên.'
        ]);

        // 2. Insert vào CSDL (Tạo user mới)
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password), // Bắt buộc mã hóa mật khẩu trước khi lưu
            'phone' => $request->phone,
            'role' => 'customer' // Mặc định là khách hàng
        ]);

        // 3. Đăng nhập luôn cho user vừa tạo
        Auth::login($user);

        // 4. Chuyển hướng về trang chủ
        return redirect()->route('home');
    }

    // --- LOGIC ĐĂNG NHẬP (KIỂM TRA CSDL) ---
    public function login(Request $request)
    {
        // 1. Validate dữ liệu gửi lên
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // 2. Truy vấn CSDL & Kiểm tra mật khẩu
        // Hàm Auth::attempt sẽ tự động:
        // - Tìm trong bảng users xem có email này không.
        // - Nếu có, nó lấy mật khẩu trong DB ra so sánh với mật khẩu người dùng nhập (đã hash).
        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $user = Auth::user();
            if ($user->role === 'admin') {
                // Nếu là Admin -> Chuyển sang trang Admin
                return redirect()->intended(route('admin.dashboard'));
            }
            
            // Nếu đúng hết -> Tạo lại session (để bảo mật)
            $request->session()->regenerate();

            // Chuyển hướng về trang chủ (hoặc trang trước đó)
            return redirect()->intended('/');
        }

        // 3. Nếu sai (Không tồn tại user hoặc sai pass) -> Trả về lỗi
        throw ValidationException::withMessages([
            'email' => 'Thông tin đăng nhập không chính xác (Sai email hoặc mật khẩu).',
        ]);
    }

    // Đăng xuất
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }
}