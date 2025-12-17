import React, { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Pages/Layouts/AdminLayout';
import { Calendar, Clock, RotateCw, Monitor, Trash2, MapPin, ChevronDown, Plus } from 'lucide-react';

export default function ShowtimeScreen({ rooms = [], selectedDate }) {
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Refs để xử lý cuộn đồng bộ
    const leftPanelRef = useRef(null);
    const rightPanelRef = useRef(null);

    // Xử lý cuộn đồng bộ: Khi cuộn timeline bên phải, cột tên phòng bên trái cuộn theo
    const handleScroll = (e) => { 
        if (leftPanelRef.current) {
            leftPanelRef.current.scrollTop = e.target.scrollTop; 
        }
    };

    // Helper: Chuyển đổi giờ thành Pixel (1 giờ = 100px)
    // Mốc bắt đầu là 8:00 sáng
    const timeToPixels = (dateString) => {
        const date = new Date(dateString);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const decimalTime = hours + (minutes / 60);
        return (decimalTime - 8) * 100;
    };

    // Helper: Tính độ rộng dựa trên thời lượng (1 giờ = 100px)
    const durationToPixels = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate - startDate;
        const diffHours = diffMs / (1000 * 60 * 60);
        return diffHours * 100;
    };

    // Helper: Format giờ hiển thị (VD: 09:30)
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    // LOGIC: Đổi ngày
    const handleDateChange = (e) => {
        router.get('/admin/showtimes', { date: e.target.value }, { preserveState: true });
    };

    // LOGIC: Tự động xếp lịch
    const handleAutoGenerate = () => {
        if (!confirm(`Xếp lại lịch ngày ${selectedDate}? Dữ liệu cũ sẽ mất!`)) return;

        setIsProcessing(true);
        router.post('/admin/showtimes/auto', { date: selectedDate }, {
            onSuccess: () => {
                alert('Xếp lịch thành công!');
                setIsProcessing(false);
            },
            onError: (err) => {
                alert('Lỗi: ' + (err.message || 'Có lỗi xảy ra'));
                setIsProcessing(false);
            }
        });
    };

    // LOGIC: Xóa suất chiếu
    const handleDeleteShowtime = (id) => {
        if(!confirm('Xóa suất chiếu này?')) return;
        router.delete(`/admin/showtimes/${id}`, { preserveScroll: true });
    };

    return (
        <AdminLayout title="Quản Lý Suất Chiếu">
            <Head title="Timeline Suất Chiếu" />

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-140px)] flex flex-col">
                
                {/* 1. THANH CÔNG CỤ (HEADER) */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-lg flex-shrink-0">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Nút Chọn Rạp (Giả lập) */}
                        <button className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg hover:border-blue-500 transition-colors">
                            <MapPin size={16} className="text-red-500"/>
                            <span className="font-bold text-sm">CineTix Central</span>
                            <ChevronDown size={14} className="text-gray-500"/>
                        </button>

                        {/* Chọn Ngày */}
                        <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-1 relative">
                            <div className="px-4 flex items-center gap-2">
                                <Calendar size={16} className="text-gray-400"/>
                                <input 
                                    type="date" 
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    className="bg-transparent border-none text-white font-bold text-sm p-0 focus:ring-0 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Nút Hành Động */}
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleAutoGenerate}
                            disabled={isProcessing}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white shadow-lg transition-all text-sm
                                ${isProcessing ? 'bg-gray-600 cursor-wait' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105'}
                            `}
                        >
                            <RotateCw size={16} className={isProcessing ? 'animate-spin' : ''} />
                            {isProcessing ? 'Đang xếp...' : 'Tự Động Xếp Lịch'}
                        </button>

                        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors text-sm shadow-lg shadow-red-900/20">
                            <Plus size={16} /> Thêm thủ công
                        </button>
                    </div>
                </div>

                {/* 2. TIMELINE AREA (MAIN CONTENT) */}
                <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 shadow-xl flex flex-col overflow-hidden">
                    <div className="flex flex-1 overflow-hidden">
                        
                        {/* CỘT TRÁI: DANH SÁCH PHÒNG (Cố định) */}
                        <div ref={leftPanelRef} className="w-40 flex-shrink-0 bg-gray-900 border-r border-gray-800 overflow-hidden no-scrollbar">
                            <div className="h-14 border-b border-gray-800 flex items-center px-4 font-bold text-gray-400 text-sm bg-gray-900 sticky top-0 z-30">
                                Phòng Chiếu
                            </div>
                            <div className="flex flex-col">
                                {rooms.map((room) => (
                                    <div key={room.room_id} className="h-24 border-b border-gray-800 p-4 flex flex-col justify-center bg-gray-900 group hover:bg-gray-800/50 transition-colors">
                                        <div className="font-bold text-sm text-white flex items-center gap-2">
                                            <Monitor size={14} className={room.name.includes('IMAX') ? 'text-yellow-500' : 'text-blue-500'}/>
                                            {room.name}
                                        </div>
                                        <span className="text-[10px] text-gray-500 mt-1">{room.type} • {room.capacity} ghế</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CỘT PHẢI: TIMELINE NGANG (Cuộn được) */}
                        <div ref={rightPanelRef} onScroll={handleScroll} className="flex-1 overflow-auto bg-gray-900 relative custom-scrollbar">
                            
                            {/* Header Giờ (Sticky Top) */}
                            <div className="h-14 sticky top-0 z-20 bg-gray-900 border-b border-gray-800 flex min-w-max shadow-sm">
                                {/* Tạo các mốc giờ từ 8:00 đến 24:00 (17 mốc) */}
                                {Array.from({ length: 17 }).map((_, i) => (
                                    <div key={i} className="w-[100px] p-4 border-r border-gray-800/30 text-xs text-gray-500 font-mono text-center flex-shrink-0 flex items-center justify-center">
                                        {i + 8}:00
                                    </div>
                                ))}
                            </div>

                            {/* Grid Suất Chiếu */}
                            <div className="min-w-max pb-20">
                                {rooms.map((room) => (
                                    <div key={room.room_id} className="h-24 border-b border-gray-800 relative bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAwIDBMMTAwIDEwMCIgc3Ryb2tlPSIjMzczNzM3IiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvc3ZnPg==')] hover:bg-gray-800/20 transition-colors">
                                        
                                        {room.showtimes?.map(show => {
                                            const isIMAX = room.name.includes('IMAX');
                                            
                                            return (
                                                <div 
                                                    key={show.showtime_id}
                                                    className={`
                                                        absolute top-2 bottom-2 rounded-lg p-2 border shadow-lg cursor-pointer hover:brightness-110 hover:z-10 hover:scale-[1.02] transition-all flex flex-col justify-center overflow-hidden group/item
                                                        ${isIMAX 
                                                            ? 'bg-yellow-900/80 border-yellow-500/50 text-yellow-100' 
                                                            : 'bg-blue-900/80 border-blue-500/50 text-blue-100'}
                                                    `}
                                                    style={{ 
                                                        left: `${timeToPixels(show.start_time)}px`, 
                                                        width: `${durationToPixels(show.start_time, show.end_time)}px` 
                                                    }}
                                                    title={`${show.movie?.title} (${formatTime(show.start_time)} - ${formatTime(show.end_time)})`}
                                                >
                                                    <div className="font-bold text-xs truncate leading-tight">{show.movie?.title}</div>
                                                    <div className="text-[10px] opacity-75 mt-1 flex items-center gap-1">
                                                        <Clock size={10}/> {formatTime(show.start_time)} - {formatTime(show.end_time)}
                                                    </div>

                                                    {/* Nút xóa ẩn (hiện khi hover) */}
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteShowtime(show.showtime_id); }}
                                                        className="hidden group-hover/item:flex absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 w-5 h-5 items-center justify-center rounded-full transition-all"
                                                        title="Xóa suất chiếu này"
                                                    >
                                                        <Trash2 size={10} className="text-white"/>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS tùy chỉnh cho thanh cuộn */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #111827; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4B5563; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </AdminLayout>
    );
}