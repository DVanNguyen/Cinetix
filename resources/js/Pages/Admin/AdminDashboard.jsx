import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from "@/Pages/Layouts/AdminLayout";
import { Users, DollarSign, Film, Ticket, TrendingUp, Clock, AlertCircle } from "lucide-react";

export default function AdminDashboard({ stats, recentBookings }) {
    
    // --- SAFE DATA HANDLING ---
    // Tạo một object an toàn để tránh lỗi "undefined" nếu dữ liệu chưa tải xong
    const safeStats = {
        daily_revenue: stats?.daily_revenue || 0,
        tickets_sold: stats?.tickets_sold || 0,
        movies_showing: stats?.movies_showing || 0,
        new_customers: stats?.new_customers || 0
    };

    const safeRecentBookings = Array.isArray(recentBookings) ? recentBookings : [];

    // Format tiền tệ VND
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Cấu hình hiển thị cho 4 thẻ thống kê
    const statCards = [
        { 
            title: "Doanh thu hôm nay", 
            value: formatCurrency(safeStats.daily_revenue), 
            icon: DollarSign, 
            color: "text-green-500", 
            bg: "bg-green-500/10" 
        },
        { 
            title: "Vé bán ra hôm nay", 
            value: safeStats.tickets_sold, 
            icon: Ticket, 
            color: "text-blue-500", 
            bg: "bg-blue-500/10" 
        },
        { 
            title: "Phim đang chiếu", 
            value: safeStats.movies_showing, 
            icon: Film, 
            color: "text-purple-500", 
            bg: "bg-purple-500/10" 
        },
        { 
            title: "Khách hàng mới (Tháng)", 
            value: safeStats.new_customers, 
            icon: Users, 
            color: "text-orange-500", 
            bg: "bg-orange-500/10" 
        },
    ];

    return (
        <AdminLayout title="Tổng Quan Dashboard">
            <Head title="Admin Dashboard" />

            {/* 1. STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg flex items-center gap-4 hover:border-gray-700 transition-all duration-300 hover:-translate-y-1">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bg}`}>
                            <stat.icon size={24} className={stat.color} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Cột chính: Bảng Giao dịch gần đây */}
                <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Clock size={20} className="text-blue-500"/> Giao dịch mới nhất
                        </h3>
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">Real-time</span>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-gray-400 bg-gray-800/50 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-6 py-4">Khách hàng</th>
                                    <th className="px-6 py-4">Phim</th>
                                    <th className="px-6 py-4">Tổng tiền</th>
                                    <th className="px-6 py-4">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {safeRecentBookings.length > 0 ? safeRecentBookings.map((booking, index) => (
                                    <tr key={booking.id || index} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-white">
                                            {booking.user}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 max-w-[200px] truncate" title={booking.movie}>
                                            {booking.movie}
                                        </td>
                                        <td className="px-6 py-4 text-green-400 font-bold font-mono">
                                            {booking.total} đ
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {booking.time}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-12 text-gray-500 flex flex-col items-center justify-center">
                                            <AlertCircle size={32} className="mb-2 opacity-50"/>
                                            Chưa có giao dịch nào hôm nay
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cột phụ: Hiệu suất rạp (Demo UI) */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-xl h-fit">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-green-500"/> Hiệu suất rạp
                    </h3>
                    
                    <div className="space-y-8">
                        {/* Progress Bar 1 */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400 font-medium">Tỷ lệ lấp đầy ghế (Hôm nay)</span>
                                <span className="text-white font-bold">75%</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-gradient-to-r from-green-600 to-green-400 h-2.5 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                            </div>
                        </div>

                        {/* Progress Bar 2 */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400 font-medium">Mục tiêu doanh thu tháng</span>
                                <span className="text-white font-bold">45%</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                        </div>

                        {/* Top Movie Card */}
                        <div className="p-5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 mt-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <p className="text-xs text-yellow-500 mb-2 uppercase font-bold tracking-widest">★ Phim Hot Nhất</p>
                            <p className="text-white font-bold text-xl mb-1 truncate">Đào, Phở và Piano</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded border border-green-500/20 font-bold">
                                    +120 vé hôm nay
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}