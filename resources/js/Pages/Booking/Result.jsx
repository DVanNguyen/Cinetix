import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Ticket } from 'lucide-react';

export default function Result({ status, booking_id, message }) {
    // Kiểm tra trạng thái. Lưu ý: Controller của bạn cần trả về status là chuỗi 'success' hoặc mã 00 (tùy logic cổng thanh toán)
    // Ở đây mình giả định status="success" là thành công.
    const isSuccess = status === 'success' || status == 0; 

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <Head title="Kết quả giao dịch" />

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    
                    {/* --- ICON TRẠNG THÁI --- */}
                    <div className="mb-6 flex justify-center">
                        {isSuccess ? (
                            <div className="rounded-full bg-green-100 p-3">
                                <svg className="h-16 w-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        ) : (
                            <div className="rounded-full bg-red-100 p-3">
                                <svg className="h-16 w-16 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* --- TIÊU ĐỀ & MESSAGE --- */}
                    <h2 className={`text-2xl font-bold ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
                        {isSuccess ? 'Đặt vé thành công!' : 'Thanh toán thất bại'}
                    </h2>
                    
                    <p className="mt-2 text-sm text-gray-500">
                        {message || (isSuccess ? 'Cảm ơn bạn đã sử dụng dịch vụ.' : 'Đã có lỗi xảy ra trong quá trình thanh toán.')}
                    </p>

                    {/* --- THÔNG TIN BOOKING ID --- */}
                    {booking_id && (
                        <div className="mt-6 border-t border-gray-200 pt-4">
                            <p className="text-xs text-gray-400 uppercase tracking-wide">Mã đơn hàng</p>
                            <p className="text-xl font-mono font-bold text-gray-800">#{booking_id}</p>
                        </div>
                    )}

                    {/* --- CÁC NÚT ĐIỀU HƯỚNG --- */}
                    <div className="mt-8 space-y-3">
                        {/* Nếu thành công thì hiện nút xem chi tiết vé */}
                        {isSuccess && booking_id && (
                            <Link
                                // Trỏ thẳng về trang Account, người dùng sẽ thấy vé vừa đặt ở tab "Vé sắp chiếu"
                                href="/account" 
                                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-red-900/30 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all transform hover:-translate-y-0.5"
                            >
                                <Ticket size={18} /> {/* Nếu có import icon Ticket */}
                                Xem vé của tôi
                            </Link>
                        )}

                        <Link
                            href="/"
                            className={`w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                isSuccess 
                                ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-indigo-500'
                                : 'border-transparent text-white bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
                            }`}
                        >
                            Về trang chủ
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}