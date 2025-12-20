import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from "@/Pages/Layouts/AdminLayout";
import { Users, DollarSign, Film, Ticket, TrendingUp, Clock, AlertCircle, BarChart3, Activity, Calendar } from "lucide-react";
import axios from 'axios';

export default function AdminDashboard({ stats, recentBookings, performance, revenueChart }) {
    const [realtimeStats, setRealtimeStats] = useState(stats);
    const [latestBookings, setLatestBookings] = useState(recentBookings);
    const [chartData, setChartData] = useState(revenueChart);

    // ✅ Polling để cập nhật realtime mỗi 10 giây
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const response = await axios.get('/admin/dashboard/realtime');
                if (response.data) {
                    setRealtimeStats(prev => ({
                        ...prev,
                        daily_revenue: response.data.daily_revenue,
                        tickets_sold: response.data.tickets_sold
                    }));

                    // Thêm booking mới nhất vào đầu danh sách
                    if (response.data.latest_booking) {
                        const newBooking = {
                            id: response.data.latest_booking.booking_id,
                            user: response.data.latest_booking.user?.name || 'Khách vãng lai',
                            movie: response.data.latest_booking.showtime?.movie?.title || 'Không xác định',
                            total: new Intl.NumberFormat('vi-VN').format(response.data.latest_booking.final_total),
                            time: 'Vừa xong',
                        };
                        
                        setLatestBookings(prev => {
                            if (prev[0]?.id !== newBooking.id) {
                                return [newBooking, ...prev.slice(0, 9)];
                            }
                            return prev;
                        });
                    }
                }
            } catch (error) {
                console.error('Lỗi cập nhật realtime:', error);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const safeStats = {
        daily_revenue: realtimeStats?.daily_revenue || 0,
        tickets_sold: realtimeStats?.tickets_sold || 0,
        movies_showing: realtimeStats?.movies_showing || 0,
        new_customers: realtimeStats?.new_customers || 0
    };

    const safeRecentBookings = Array.isArray(latestBookings) ? latestBookings : [];
    const safePerformance = performance || { occupancy_rate: 0, revenue_progress: 0, top_movie: {} };
    const safeChartData = Array.isArray(chartData) ? chartData : [];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

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

            {/* STATS GRID */}
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

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Cột chính: Bảng Giao dịch */}
                <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Clock size={20} className="text-blue-500"/> Giao dịch mới nhất
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">Real-time</span>
                        </div>
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
                                    <tr key={booking.id || index} className="hover:bg-gray-800/50 transition-colors animate-in fade-in duration-300" style={{ animationDelay: `${index * 50}ms` }}>
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
                                        <td colSpan="4" className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center text-gray-500">
                                                <AlertCircle size={32} className="mb-2 opacity-50"/>
                                                <p>Chưa có giao dịch nào hôm nay</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cột phụ: Hiệu suất rạp */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-xl h-fit">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-green-500"/> Hiệu suất rạp
                    </h3>
                    
                    <div className="space-y-8">
                        {/* Progress Bar 1: Tỷ lệ lấp đầy */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400 font-medium flex items-center gap-2">
                                    <Activity size={14}/>
                                    Tỷ lệ lấp đầy ghế (Hôm nay)
                                </span>
                                <span className="text-white font-bold">{safePerformance.occupancy_rate}%</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden relative">
                                <div 
                                    className={`h-3 rounded-full transition-all duration-1000 relative overflow-hidden ${
                                        safePerformance.occupancy_rate >= 80 ? 'bg-gradient-to-r from-green-600 to-green-400' :
                                        safePerformance.occupancy_rate >= 50 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' :
                                        'bg-gradient-to-r from-red-600 to-red-400'
                                    }`}
                                    style={{ width: `${safePerformance.occupancy_rate}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                {safePerformance.occupancy_rate >= 80 ? '🔥 Rất tốt!' :
                                 safePerformance.occupancy_rate >= 50 ? '✅ Khá tốt' :
                                 '⚠️ Cần cải thiện'}
                            </p>
                        </div>

                        {/* Progress Bar 2: Mục tiêu doanh thu */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400 font-medium flex items-center gap-2">
                                    <DollarSign size={14}/>
                                    Mục tiêu doanh thu tháng
                                </span>
                                <span className="text-white font-bold">{safePerformance.revenue_progress}%</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden relative">
                                <div 
                                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-3 rounded-full transition-all duration-1000 relative overflow-hidden" 
                                    style={{ width: `${safePerformance.revenue_progress}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                {formatCurrency(safePerformance.monthly_revenue)} / {formatCurrency(safePerformance.monthly_target)}
                            </p>
                        </div>

                        {/* Top Movie Card */}
                        <div className="p-5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 mt-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <p className="text-xs text-yellow-500 mb-2 uppercase font-bold tracking-widest flex items-center gap-1">
                                ⭐ Phim Hot Nhất
                            </p>
                            <p className="text-white font-bold text-xl mb-1 truncate">{safePerformance.top_movie?.title || 'Chưa có dữ liệu'}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded border border-green-500/20 font-bold">
                                    +{safePerformance.top_movie?.tickets || 0} vé hôm nay
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BIỂU ĐỒ DOANH THU 7 NGÀY - CẢI TIẾN */}
            {safeChartData.length > 0 && (
                <div className="mt-8 bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <BarChart3 size={20} className="text-purple-500"/> Doanh thu 7 ngày gần nhất
                        </h3>
                        <div className="flex gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                <span className="text-gray-400">Doanh thu</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded"></div>
                                <span className="text-gray-400">Tỷ lệ lấp đầy</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Biểu đồ cột */}
                    <div className="flex items-end ml-10 justify-between gap-3 h-64 relative">
                        {/* Lưới ngang */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                            {[100, 75, 50, 25, 0].map((val, i) => (
                                <div key={i} className="w-full border-t border-gray-800/50 relative">
                                    <span className="absolute -left-9 top-0 -translate-y-1/2 text-[10px] text-gray-600">{val}%</span>
                                </div>
                            ))}
                        </div>

                        {safeChartData.map((day, index) => {
                            const maxRevenue = Math.max(...safeChartData.map(d => d.revenue));
                            const revenueHeight = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                            const occupancyHeight = day.occupancy || 0;
                            
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2 relative z-10 h-full justify-end">
                                    {/* Cột doanh thu */}
                                    <div className="w-full flex gap-1 items-end flex-1">
                                        <div className="flex-1 bg-gray-800 h-full flex items-end rounded-t-lg overflow-hidden relative group">
                                            <div 
                                                className={`w-full bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-700 hover:from-blue-500 hover:to-blue-300 ${
                                                    day.is_weekend ? 'shadow-lg shadow-blue-500/50' : ''
                                                }`}
                                                style={{ height: `${revenueHeight}%`, minHeight: '4px' }}
                                            >
                                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl">
                                                    <div className="font-bold text-blue-400">{formatCurrency(day.revenue)}</div>
                                                    <div className="text-gray-400">{day.tickets} vé</div>
                                                    <div className="text-green-400">{day.occupancy}% lấp đầy</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Cột tỷ lệ lấp đầy (nhỏ hơn) */}
                                        <div className="w-2 bg-gray-800 rounded-t-lg overflow-hidden">
                                            <div 
                                                className="w-full bg-gradient-to-t from-green-600 to-green-400 transition-all duration-700"
                                                style={{ height: `${occupancyHeight}%`, minHeight: '2px' }}
                                            ></div>
                                        </div>
                                    </div>
                                    
                                    {/* Nhãn ngày */}
                                    <div className="text-center">
                                        <div className={`text-xs font-bold ${day.is_weekend ? 'text-yellow-400' : 'text-gray-400'}`}>
                                            {day.date}
                                        </div>
                                        <div className="text-[10px] text-gray-600">{day.day_name}</div>
                                    </div>
                
                                </div>
                            );
                        })}
                    </div>

                    {/* Thống kê tổng quan */}
                    <div className="mt-6 grid grid-cols-3 gap-4">
                        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                            <p className="text-xs text-gray-400 mb-1">Tổng doanh thu</p>
                            <p className="text-lg font-bold text-white">
                                {formatCurrency(safeChartData.reduce((sum, day) => sum + day.revenue, 0))}
                            </p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                            <p className="text-xs text-gray-400 mb-1">Tổng vé bán</p>
                            <p className="text-lg font-bold text-blue-400">
                                {safeChartData.reduce((sum, day) => sum + day.tickets, 0)} vé
                            </p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                            <p className="text-xs text-gray-400 mb-1">TB lấp đầy</p>
                            <p className="text-lg font-bold text-green-400">
                                {(safeChartData.reduce((sum, day) => sum + day.occupancy, 0) / safeChartData.length).toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}