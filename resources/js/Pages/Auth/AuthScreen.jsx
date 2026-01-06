import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Mail, Lock, User, Phone, Eye, EyeOff, PlayCircle, Info } from 'lucide-react';

export default function AuthScreen({ intended_url = '/' }) {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form đăng nhập
    const loginForm = useForm({
        email: '',
        password: '',
        remember: false,
        intended_url: intended_url
    });

    // Form đăng ký
    const registerForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        intended_url: intended_url
    });

    // ✅ Lấy intended URL từ sessionStorage khi component mount
    useEffect(() => {
        const savedUrl = sessionStorage.getItem('intended_url');
        if (savedUrl) {
            loginForm.setData('intended_url', savedUrl);
            registerForm.setData('intended_url', savedUrl);
            // Clear sau khi lấy để tránh dùng lại
            sessionStorage.removeItem('intended_url');
        }
    }, []);

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        loginForm.post('/login', {
            onSuccess: () => {
                // Backend sẽ tự động redirect về intended URL
            },
            onError: (errors) => {
                console.error('Login error:', errors);
            }
        });
    };

    const handleRegisterSubmit = (e) => {
        e.preventDefault();
        registerForm.post('/register', {
            onSuccess: () => {
                // Backend sẽ tự động redirect về intended URL
            },
            onError: (errors) => {
                console.error('Register error:', errors);
            }
        });
    };

    // Chuyển đổi giữa Login/Register
    const toggleMode = () => {
        setIsLogin(!isLogin);
        // Reset errors khi chuyển mode
        loginForm.clearErrors();
        registerForm.clearErrors();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
            <Head title={isLogin ? "Đăng nhập - CineTix" : "Đăng ký - CineTix"} />

            {/* Background Animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            {/* Main Container */}
            <div className="relative z-10 w-full max-w-5xl flex bg-gray-900/80 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
                
                {/* Left Side - Branding */}
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-600 to-red-800 p-12 flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-20"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                                <PlayCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <span className="text-3xl font-black text-white">CineTix</span>
                        </div>
                        
                        <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                            Trải nghiệm điện ảnh <br />
                            đỉnh cao mọi lúc
                        </h2>
                        <p className="text-red-100 text-lg">
                            Đặt vé nhanh chóng, thanh toán dễ dàng, thưởng thức phim hay ngay hôm nay!
                        </p>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3 text-white/90">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">✓</div>
                            <span>Hơn 100+ rạp trên toàn quốc</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/90">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">✓</div>
                            <span>Ưu đãi độc quyền cho thành viên</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/90">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">✓</div>
                            <span>Thanh toán an toàn & bảo mật</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full lg:w-1/2 p-8 md:p-12">
                    
                    {/* ✅ Alert khi có intended URL */}
                    {intended_url !== '/' && (
                        <div className="mb-6 bg-blue-900/20 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top duration-300">
                            <div className="mt-0.5">
                                <Info className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-blue-400 font-bold text-sm mb-1">
                                    Vui lòng đăng nhập để tiếp tục
                                </p>
                                <p className="text-blue-300 text-xs">
                                    Bạn sẽ được chuyển đến trang đặt vé sau khi đăng nhập thành công.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="mb-8">
                        <h3 className="text-3xl font-bold text-white mb-2">
                            {isLogin ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
                        </h3>
                        <p className="text-gray-400">
                            {isLogin 
                                ? 'Đăng nhập để tiếp tục đặt vé xem phim' 
                                : 'Đăng ký để nhận ưu đãi độc quyền'}
                        </p>
                    </div>

                    {/* FORM ĐĂNG NHẬP */}
                    {isLogin ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-5">
                            {/* Hidden input for intended URL */}
                            <input type="hidden" name="intended_url" value={loginForm.data.intended_url} />

                            {/* Email */}
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="email"
                                        value={loginForm.data.email}
                                        onChange={e => loginForm.setData('email', e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 text-white pl-12 pr-4 py-3 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                                        placeholder="example@email.com"
                                        required
                                    />
                                </div>
                                {loginForm.errors.email && (
                                    <p className="text-red-500 text-xs mt-1">{loginForm.errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2">
                                    Mật khẩu
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={loginForm.data.password}
                                        onChange={e => loginForm.setData('password', e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 text-white pl-12 pr-12 py-3 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {loginForm.errors.password && (
                                    <p className="text-red-500 text-xs mt-1">{loginForm.errors.password}</p>
                                )}
                            </div>

                            {/* Remember & Forgot */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={loginForm.data.remember}
                                        onChange={e => loginForm.setData('remember', e.target.checked)}
                                        className="w-4 h-4 accent-red-600 rounded"
                                    />
                                    <span className="text-gray-400 text-sm">Ghi nhớ đăng nhập</span>
                                </label>
                                <a href="/forgot-password" className="text-red-500 text-sm hover:underline">
                                    Quên mật khẩu?
                                </a>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loginForm.processing}
                                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loginForm.processing ? 'Đang xử lý...' : 'Đăng nhập'}
                            </button>
                        </form>
                    ) : (
                        /* FORM ĐĂNG KÝ */
                        <form onSubmit={handleRegisterSubmit} className="space-y-5">
                            {/* Hidden input for intended URL */}
                            <input type="hidden" name="intended_url" value={registerForm.data.intended_url} />

                            {/* Name */}
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2">
                                    Họ và tên
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="text"
                                        value={registerForm.data.name}
                                        onChange={e => registerForm.setData('name', e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 text-white pl-12 pr-4 py-3 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                                        placeholder="Nguyễn Văn A"
                                        required
                                    />
                                </div>
                                {registerForm.errors.name && (
                                    <p className="text-red-500 text-xs mt-1">{registerForm.errors.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="email"
                                        value={registerForm.data.email}
                                        onChange={e => registerForm.setData('email', e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 text-white pl-12 pr-4 py-3 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                                        placeholder="example@email.com"
                                        required
                                    />
                                </div>
                                {registerForm.errors.email && (
                                    <p className="text-red-500 text-xs mt-1">{registerForm.errors.email}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2">
                                    Số điện thoại
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="tel"
                                        value={registerForm.data.phone}
                                        onChange={e => registerForm.setData('phone', e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 text-white pl-12 pr-4 py-3 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                                        placeholder="0912345678"
                                        required
                                    />
                                </div>
                                {registerForm.errors.phone && (
                                    <p className="text-red-500 text-xs mt-1">{registerForm.errors.phone}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2">
                                    Mật khẩu
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={registerForm.data.password}
                                        onChange={e => registerForm.setData('password', e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 text-white pl-12 pr-12 py-3 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                                        placeholder="Tối thiểu 6 ký tự"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {registerForm.errors.password && (
                                    <p className="text-red-500 text-xs mt-1">{registerForm.errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2">
                                    Xác nhận mật khẩu
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={registerForm.data.password_confirmation}
                                        onChange={e => registerForm.setData('password_confirmation', e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 text-white pl-12 pr-12 py-3 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                                        placeholder="Nhập lại mật khẩu"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={registerForm.processing}
                                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {registerForm.processing ? 'Đang xử lý...' : 'Đăng ký'}
                            </button>
                        </form>
                    )}

                    {/* Toggle Login/Register */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-400 text-sm">
                            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
                            <button
                                onClick={toggleMode}
                                className="text-red-500 font-bold hover:underline"
                            >
                                {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}