import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react'; 
import { 
    Film, Ticket, User, Phone, Mail, Lock, Eye, EyeOff, 
    ArrowRight, Chrome, Facebook 
} from 'lucide-react';

export default function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    // --- SETUP FORM INERTIA ---
    // data: Chứa dữ liệu form
    // setData: Hàm cập nhật dữ liệu
    // post: Hàm gửi request POST
    // processing: True khi đang gửi (để hiện loading)
    // errors: Chứa lỗi từ Laravel trả về (VD: sai pass, trùng email)
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        phone: '',
        email: '',
        password: '',
        password_confirmation: '', // Laravel cần trường này để check confirm
    });

    // Hàm chuyển đổi chế độ Login/Register
    const toggleMode = () => {
        setIsLogin(!isLogin);
        clearErrors(); // Xóa lỗi cũ
        reset();       // Xóa dữ liệu cũ
    };

    // Xử lý Submit
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (isLogin) {
            // Gửi request Đăng nhập
            post('/login'); 
        } else {
            // Gửi request Đăng ký
            post('/register');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans text-gray-100 relative overflow-hidden">
            <Head title={isLogin ? "Đăng Nhập" : "Đăng Ký"} />

            {/* Background Glow giữ nguyên */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-red-600 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-orange-600 rounded-full blur-[100px] opacity-20"></div>
            </div>

            <div className="w-full max-w-5xl h-auto min-h-[600px] bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-gray-700">
                {/* Phần Bìa bên trái (Giữ nguyên, cắt bớt cho gọn code hiển thị ở đây) */}
                <div className="hidden md:flex md:w-1/2 relative bg-black items-center justify-center overflow-hidden group">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop')" }}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90"></div>
                    <div className="relative z-10 text-center px-10">
                        <h2 className="text-4xl font-bold text-white mb-3">CineTix Cinema</h2>
                        <p className="text-gray-300">Đăng nhập để đặt vé ngay.</p>
                    </div>
                </div>

                {/* Phần Form bên phải */}
                <div className="w-full md:w-1/2 bg-gray-900 md:bg-gray-800 p-8 md:p-12 flex flex-col justify-center">
                    
                    <div className="mb-8">
                        <h3 className="text-3xl font-bold text-white mb-2">{isLogin ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}</h3>
                        {/* Hiển thị lỗi chung nếu có */}
                        {Object.keys(errors).length > 0 && (
                            <div className="text-red-500 text-sm bg-red-500/10 p-2 rounded border border-red-500/20 mt-2">
                                Vui lòng kiểm tra lại thông tin bên dưới.
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {errors.email && isLogin && (
                            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm text-center">
                                {errors.email}
                            </div>
                        )}

                        {/* Tên (Chỉ hiện khi Register) */}
                        {!isLogin && (
                            <div className="space-y-1">
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input 
                                        type="text" placeholder="Họ và tên"
                                        value={data.name} onChange={e => setData('name', e.target.value)}
                                        className="w-full bg-gray-700/50 border border-gray-600 text-white pl-11 pr-4 py-3.5 rounded-lg focus:outline-none focus:border-red-500"
                                    />
                                </div>
                                {errors.name && <p className="text-red-500 text-xs pl-1">{errors.name}</p>}
                            </div>
                        )}

                        {/* Số điện thoại (Chỉ hiện khi Register) */}
                        {!isLogin && (
                            <div className="space-y-1">
                                <div className="relative group">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input 
                                        type="text" placeholder="Số điện thoại"
                                        value={data.phone} onChange={e => setData('phone', e.target.value)}
                                        className="w-full bg-gray-700/50 border border-gray-600 text-white pl-11 pr-4 py-3.5 rounded-lg focus:outline-none focus:border-red-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-1">
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                <input 
                                    type="email" placeholder="Địa chỉ Email"
                                    value={data.email} onChange={e => setData('email', e.target.value)}
                                    className={`w-full bg-gray-700/50 border text-white pl-11 pr-4 py-3.5 rounded-lg focus:outline-none focus:border-red-500 ${errors.email ? 'border-red-500' : 'border-gray-600'}`}
                                />
                            </div>
                            {errors.email && !isLogin && <p className="text-red-500 text-xs pl-1">{errors.email}</p>}
                        </div>

                        {/* Mật khẩu */}
                        <div className="space-y-1">
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                <input 
                                    type={showPassword ? "text" : "password"} placeholder="Mật khẩu"
                                    value={data.password} onChange={e => setData('password', e.target.value)}
                                    className="w-full bg-gray-700/50 border border-gray-600 text-white pl-11 pr-12 py-3.5 rounded-lg focus:outline-none focus:border-red-500"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                    {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-xs pl-1">{errors.password}</p>}
                        </div>

                        {/* Nhập lại mật khẩu (Chỉ Register) */}
                        {!isLogin && (
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                <input 
                                    type="password" placeholder="Xác nhận mật khẩu"
                                    value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)}
                                    className="w-full bg-gray-700/50 border border-gray-600 text-white pl-11 pr-4 py-3.5 rounded-lg focus:outline-none focus:border-red-500"
                                />
                            </div>
                        )}

                        <button 
                            type="submit" disabled={processing}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg shadow-lg flex items-center justify-center gap-3 disabled:opacity-70"
                        >
                            {processing ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>{isLogin ? 'Đăng Nhập' : 'Đăng Ký Ngay'}</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center text-sm text-gray-400">
                        <span>{isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}</span>
                        <button type="button" onClick={toggleMode} className="ml-2 text-red-500 font-bold hover:underline">
                            {isLogin ? 'Đăng ký miễn phí' : 'Đăng nhập'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}