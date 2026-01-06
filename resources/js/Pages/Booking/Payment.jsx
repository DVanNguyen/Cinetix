import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { ChevronLeft, Clock, CreditCard, Loader2, Wallet, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function Payment({ showtime, seats, combos, totalAmount, user }) {
    const [paymentMethod, setPaymentMethod] = useState('momo');
    const [isProcessing, setIsProcessing] = useState(false);

    // ✅ Kiểm tra số dư ví có đủ không
    const walletBalance = user.wallet_balance || 0;
    const hasEnoughBalance = walletBalance >= totalAmount;

    // Xử lý nút "Thanh Toán Ngay"
    const handlePayment = async () => {
        if(isProcessing) return;

        // Kiểm tra số dư nếu chọn ví
        if (paymentMethod === 'wallet' && !hasEnoughBalance) {
            alert('Số dư ví không đủ. Vui lòng nạp thêm hoặc chọn phương thức khác.');
            return;
        }

        setIsProcessing(true);

        try {
            const res = await axios.post('/payment/process', {
                showtime_id: showtime.showtime_id,
                seat_ids: seats.map(s => s.seat_id),
                payment_method: paymentMethod,
                combos: combos
            });

            // CASE 1: Cần chuyển hướng sang Momo
            if (res.data.status === 'redirect') {
                window.location.href = res.data.url; 
            } 
            // CASE 2: Thanh toán thành công ngay (Ví Xu / Tiền mặt)
            else if (res.data.status === 'success') {
                window.location.href = `/payment/result?status=success&booking_id=${res.data.booking_id}`;
            }

        } catch (error) {
            alert(error.response?.data?.message || "Lỗi xử lý thanh toán!");
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
            <Head title="Thanh toán" />

            {/* Header */}
            <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
                <div className="container mx-auto max-w-5xl flex items-center gap-4">
                    <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-800 rounded-full">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="font-bold text-xl">Thanh toán</h1>
                    <div className="ml-auto bg-red-900/20 px-4 py-1.5 rounded-lg text-red-500 font-mono text-sm flex items-center gap-2 border border-red-500/20">
                        <Clock className="w-4 h-4" /> 10:00
                    </div>
                </div>
            </header>

            <div className="container mx-auto max-w-5xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* CỘT TRÁI: PHƯƠNG THỨC THANH TOÁN */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Thông tin người nhận */}
                    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                        <h3 className="font-bold mb-4 text-white">Thông tin nhận vé</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500">Họ tên</label>
                                <input disabled value={user.name} className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-2 text-gray-300" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Email</label>
                                <input disabled value={user.email} className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-2 text-gray-300" />
                            </div>
                        </div>
                    </div>

                    {/* ✅ Hiển thị số dư ví */}
                    <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded-2xl p-6 border border-yellow-500/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                                    <Wallet className="w-6 h-6 text-yellow-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Số dư Ví Xu hiện tại</p>
                                    <p className="text-2xl font-bold text-yellow-400">
                                        {walletBalance.toLocaleString()} <span className="text-sm">Xu</span>
                                    </p>
                                </div>
                            </div>
                            {!hasEnoughBalance && paymentMethod === 'wallet' && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                    <p className="text-xs text-red-400 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        Không đủ số dư
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Phương thức thanh toán */}
                    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                        <h3 className="font-bold mb-4 text-white">Phương thức thanh toán</h3>
                        <div className="space-y-3">
                            
                            {/* ✅ Option Ví Xu */}
                            <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition ${
                                paymentMethod === 'wallet' 
                                    ? 'border-yellow-500 bg-yellow-500/5' 
                                    : 'border-gray-700 hover:bg-gray-800'
                            } ${!hasEnoughBalance ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <input 
                                    type="radio" 
                                    name="pay" 
                                    value="wallet" 
                                    checked={paymentMethod === 'wallet'} 
                                    onChange={() => setPaymentMethod('wallet')} 
                                    disabled={!hasEnoughBalance}
                                    className="accent-yellow-500 w-5 h-5"
                                />
                                <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                                    <Wallet className="w-5 h-5 text-yellow-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold flex items-center gap-2">
                                        Ví Xu
                                        {hasEnoughBalance && (
                                            <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20">
                                                Khuyến nghị
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {hasEnoughBalance 
                                            ? `Còn lại ${(walletBalance - totalAmount).toLocaleString()} Xu` 
                                            : `Thiếu ${(totalAmount - walletBalance).toLocaleString()} Xu`
                                        }
                                    </div>
                                </div>
                                {!hasEnoughBalance && (
                                    <span className="text-xs text-red-500 font-bold">Không đủ</span>
                                )}
                            </label>

                            {/* Option Momo */}
                            <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition ${
                                paymentMethod === 'momo' 
                                    ? 'border-pink-500 bg-pink-500/5' 
                                    : 'border-gray-700 hover:bg-gray-800'
                            }`}>
                                <input type="radio" name="pay" value="momo" checked={paymentMethod === 'momo'} onChange={() => setPaymentMethod('momo')} className="accent-pink-500 w-5 h-5"/>
                                <div className="w-10 h-10 bg-[#A50064] rounded-lg flex items-center justify-center font-bold text-white text-xs">MoMo</div>
                                <div><div className="font-bold">Ví MoMo</div><div className="text-xs text-gray-400">Quét mã QR</div></div>
                            </label>

                            {/* Option ATM */}
                            <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition ${
                                paymentMethod === 'atm' 
                                    ? 'border-blue-500 bg-blue-500/5' 
                                    : 'border-gray-700 hover:bg-gray-800'
                            }`}>
                                <input type="radio" name="pay" value="atm" checked={paymentMethod === 'atm'} onChange={() => setPaymentMethod('atm')} className="accent-blue-500 w-5 h-5"/>
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white"><CreditCard className="w-5 h-5"/></div>
                                <div><div className="font-bold">Thẻ ATM / Banking</div><div className="text-xs text-gray-400">Thẻ nội địa</div></div>
                            </label>
                             
                            {/* Option Tiền mặt */}
                            <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition ${
                                paymentMethod === 'cash' 
                                    ? 'border-green-500 bg-green-500/5' 
                                    : 'border-gray-700 hover:bg-gray-800'
                            }`}>
                                <input type="radio" name="pay" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="accent-green-500 w-5 h-5"/>
                                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">$</div>
                                <div>
                                    <div className="font-bold">Tiền mặt</div>
                                    <div className="text-xs text-gray-400">Thanh toán tại quầy</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 sticky top-24 overflow-hidden">
                        <div className="relative h-32">
                            <img src={showtime.movie.poster_url || "https://via.placeholder.com/300x450"} className="w-full h-full object-cover opacity-50" alt="poster" />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                            <div className="absolute bottom-4 left-4">
                                <h3 className="font-bold text-lg text-white shadow-black drop-shadow-md">{showtime.movie.title}</h3>
                            </div>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-white font-bold">{showtime.room.cinema.name}</p>
                                <p className="text-sm text-gray-400">{showtime.room.name} • {showtime.start_time}</p>
                            </div>
                            
                            <div className="border-t border-dashed border-gray-700 my-4"></div>
                            
                            {/* List Ghế */}
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Ghế chọn</span>
                                <span className="font-bold text-white max-w-[150px] text-right">
                                    {seats.map(s => s.seat_code).join(', ')}
                                </span>
                            </div>

                            {/* List Combo */}
                            {combos && combos.length > 0 && (
                                <div className="space-y-2 pt-2">
                                    {combos.map((combo, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-gray-400">{combo.quantity}x {combo.name}</span>
                                            <span className="text-white">{combo.total.toLocaleString()} đ</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                                <span className="text-gray-300">Tổng thanh toán</span>
                                <span className="text-2xl font-bold text-red-500">{totalAmount.toLocaleString()} đ</span>
                            </div>

                            {/* ✅ Thông báo khi dùng ví */}
                            {paymentMethod === 'wallet' && hasEnoughBalance && (
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                    <p className="text-xs text-blue-400 flex items-center gap-2">
                                        <Wallet size={12} />
                                        Thanh toán bằng Ví Xu
                                    </p>
                                </div>
                            )}

                            <button 
                                onClick={handlePayment} 
                                disabled={isProcessing || (paymentMethod === 'wallet' && !hasEnoughBalance)}
                                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="animate-spin" /> Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        {paymentMethod === 'wallet' && '🪙 '}
                                        Thanh Toán Ngay
                                    </>
                                )}
                            </button>

                            {paymentMethod === 'wallet' && !hasEnoughBalance && (
                                <p className="text-xs text-center text-red-400 mt-2">
                                    Vui lòng nạp thêm {(totalAmount - walletBalance).toLocaleString()} Xu
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}