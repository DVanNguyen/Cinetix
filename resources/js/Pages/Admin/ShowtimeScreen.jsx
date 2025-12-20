import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Pages/Layouts/AdminLayout';
import { Calendar, Clock, RotateCw, Monitor, Trash2, MapPin, ChevronDown, Plus, Filter, Zap, AlertTriangle } from 'lucide-react';

export default function ShowtimeScreen({ 
    cinemas = [], 
    selectedCinema,
    selectedDate, 
    rooms = [] 
}) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showCinemaMenu, setShowCinemaMenu] = useState(false);
    const [showDateMenu, setShowDateMenu] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkDays, setBulkDays] = useState(14);
    const [forceRegenerate, setForceRegenerate] = useState(false);

    // ✅ CẤU HÌNH TIMELINE: 8:00 - 00:00
    const PIXELS_PER_HOUR = 140;
    const START_HOUR = 8;
    const END_HOUR = 24;
    const TOTAL_HOURS = END_HOUR - START_HOUR;
    const TIMELINE_WIDTH = TOTAL_HOURS * PIXELS_PER_HOUR;

    // ✅ Helper functions
    const timeToPixels = (dateString) => {
        const date = new Date(dateString);
        let hours = date.getHours();
        const minutes = date.getMinutes();
        if (hours < START_HOUR) hours += 24;
        const decimalTime = hours + (minutes / 60);
        return (decimalTime - START_HOUR) * PIXELS_PER_HOUR;
    };

    const durationToPixels = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate - startDate;
        const diffHours = diffMs / (1000 * 60 * 60);
        return diffHours * PIXELS_PER_HOUR;
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const dateOptions = useMemo(() => {
        return Array.from({ length: 14 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i);
            return {
                value: d.toISOString().split('T')[0],
                label: i === 0 ? 'Hôm nay' : d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })
            };
        });
    }, []);

    // ✅ HANDLERS
    const handleCinemaChange = (id) => {
        router.get('/admin/showtimes', { cinema_id: id, date: selectedDate }, { preserveState: false });
        setShowCinemaMenu(false);
    };

    const handleDateChange = (date) => {
        router.get('/admin/showtimes', { 
            cinema_id: selectedCinema?.cinema_id, 
            date: date 
        }, { preserveState: false });
        setShowDateMenu(false);
    };

    const handleAutoGenerate = () => {
        if (!selectedCinema) return alert('Vui lòng chọn rạp trước!');
        if (!confirm(`Xếp lịch tự động cho ${selectedCinema.name} vào ngày ${selectedDate}?`)) return;

        setIsProcessing(true);
        router.post('/admin/showtimes/auto', { 
            cinema_id: selectedCinema.cinema_id, 
            date: selectedDate 
        }, {
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

    // ✅ XẾP TOÀN BỘ 14 NGÀY
    const handleBulkGenerate = () => {
        if (!selectedCinema) return alert('Vui lòng chọn rạp trước!');
        
        setIsProcessing(true);
        setShowBulkModal(false);

        router.post('/admin/showtimes/bulk-generate', { 
            cinema_id: selectedCinema.cinema_id, 
            start_date: selectedDate,
            days: bulkDays,
            force_regenerate: forceRegenerate
        }, {
            onSuccess: (response) => { 
                alert(response.props?.flash?.success || 'Xếp lịch toàn bộ thành công!'); 
                setIsProcessing(false); 
            },
            onError: (err) => { 
                alert('Lỗi: ' + (err.message || 'Có lỗi xảy ra')); 
                setIsProcessing(false); 
            }
        });
    };

    const handleDeleteShowtime = (id) => {
        if(!confirm('Bạn chắc chắn muốn xóa suất chiếu này?')) return;
        router.delete(`/admin/showtimes/${id}`, { preserveScroll: true });
    };

    return (
        <AdminLayout title="Quản Lý Suất Chiếu">
            <Head title="Timeline Suất Chiếu" />

            {/* ✅ MODAL XẾP TOÀN BỘ */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                        <button 
                            onClick={() => setShowBulkModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-purple-500/10 p-3 rounded-xl">
                                <Zap size={24} className="text-purple-500"/>
                            </div>
                            <h3 className="text-xl font-bold text-white">Xếp Lịch Toàn Bộ</h3>
                        </div>

                        <p className="text-gray-400 mb-6">
                            Tự động xếp lịch chiếu cho <span className="text-white font-bold">{selectedCinema?.name}</span> trong nhiều ngày liên tiếp.
                        </p>

                        {/* Số ngày */}
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-400 mb-2">Số ngày xếp lịch</label>
                            <select 
                                value={bulkDays}
                                onChange={(e) => setBulkDays(parseInt(e.target.value))}
                                className="w-full bg-[#27272a] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value={7}>7 ngày</option>
                                <option value={14}>14 ngày (khuyến nghị)</option>
                                <option value={21}>21 ngày</option>
                                <option value={30}>30 ngày</option>
                            </select>
                        </div>

                        {/* Force regenerate */}
                        <div className="mb-6 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    checked={forceRegenerate}
                                    onChange={(e) => setForceRegenerate(e.target.checked)}
                                    className="mt-1 w-4 h-4 accent-purple-500"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertTriangle size={14} className="text-yellow-500"/>
                                        <span className="text-sm font-bold text-white">Xếp lại tất cả</span>
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        Xóa và tạo lại lịch chiếu cho các ngày đã có (không ảnh hưởng vé đã bán)
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowBulkModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors font-bold"
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={handleBulkGenerate}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:brightness-110 transition-all shadow-lg"
                            >
                                Bắt Đầu Xếp
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ CONTAINER CHÍNH */}
            <div className="flex flex-col h-screen w-full bg-[#0b0b0f] text-gray-100 overflow-hidden">
                
                {/* 1. TOOLBAR */}
                <div className="h-20 shrink-0 bg-[#18181b] border-b border-white/10 px-6 flex items-center justify-between z-50 shadow-md">
                    <div className="flex items-center gap-4">
                        
                        {/* Cinema Selector */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowCinemaMenu(!showCinemaMenu)} 
                                className="flex items-center gap-3 bg-[#27272a] hover:bg-[#3f3f46] text-white px-4 py-2.5 rounded-xl border border-white/10 transition-all min-w-[220px]"
                            >
                                <div className="bg-red-500/10 p-1.5 rounded-lg"><MapPin size={18} className="text-red-500"/></div>
                                <div className="text-left flex-1">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Rạp chiếu</p>
                                    <p className="text-sm font-bold truncate">{selectedCinema?.name || 'Chọn rạp...'}</p>
                                </div>
                                <ChevronDown size={16} className="text-gray-500"/>
                            </button>
                            
                            {showCinemaMenu && (
                                <div className="absolute top-full left-0 mt-2 w-72 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl z-50 p-2">
                                    <div className="font-bold text-gray-400 px-2 py-1 text-xs uppercase tracking-wider">Danh sách rạp</div>
                                    {cinemas.length > 0 ? cinemas.map(cinema => (
                                        <button 
                                            key={cinema.cinema_id} 
                                            onClick={() => handleCinemaChange(cinema.cinema_id)} 
                                            className={`w-full text-left px-4 py-2.5 hover:bg-white/5 rounded-lg text-sm transition-colors ${
                                                selectedCinema?.cinema_id === cinema.cinema_id ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-white'
                                            }`}
                                        >
                                            <div className="font-bold">{cinema.name}</div>
                                            <div className="text-xs opacity-60 truncate">{cinema.address}</div>
                                        </button>
                                    )) : (
                                        <div className="p-4 text-center text-gray-500 text-sm">Chưa có dữ liệu rạp</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Date Selector */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowDateMenu(!showDateMenu)} 
                                className="flex items-center gap-3 bg-[#27272a] hover:bg-[#3f3f46] text-white px-4 py-2.5 rounded-xl border border-white/10 transition-all min-w-[180px]"
                            >
                                <div className="bg-blue-500/10 p-1.5 rounded-lg"><Calendar size={18} className="text-blue-500"/></div>
                                <div className="text-left flex-1">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Ngày chiếu</p>
                                    <p className="text-sm font-bold">{dateOptions.find(d => d.value === selectedDate)?.label || selectedDate}</p>
                                </div>
                                <ChevronDown size={16} className="text-gray-500"/>
                            </button>
                            
                            {showDateMenu && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl z-50 p-2">
                                    {dateOptions.map(date => (
                                        <button 
                                            key={date.value} 
                                            onClick={() => handleDateChange(date.value)} 
                                            className={`w-full text-left px-4 py-2.5 hover:bg-white/5 rounded-lg text-sm transition-colors ${
                                                selectedDate === date.value ? 'bg-blue-600 text-white font-bold' : 'text-gray-300'
                                            }`}
                                        >
                                            {date.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {/* Nút Xếp Ngày Hiện Tại */}
                        <button 
                            onClick={handleAutoGenerate} 
                            disabled={isProcessing || !selectedCinema}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all ${
                                isProcessing || !selectedCinema 
                                    ? 'bg-gray-700 cursor-not-allowed opacity-50' 
                                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:brightness-110'
                            }`}
                        >
                            <RotateCw size={18} className={isProcessing ? 'animate-spin' : ''} />
                            {isProcessing ? 'Đang xếp...' : 'Xếp Ngày Này'}
                        </button>

                        {/* Nút Xếp Toàn Bộ */}
                        <button 
                            onClick={() => setShowBulkModal(true)} 
                            disabled={isProcessing || !selectedCinema}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all ${
                                isProcessing || !selectedCinema 
                                    ? 'bg-gray-700 cursor-not-allowed opacity-50' 
                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110'
                            }`}
                        >
                            <Zap size={18} />
                            Xếp Toàn Bộ
                        </button>
                    </div>
                </div>

                {/* ✅ 2. TIMELINE SCROLL AREA */}
                <div className="flex-1 w-full min-h-0 p-6 overflow-hidden bg-[#0b0b0f]">
                    
                    <div className="w-full overflow-auto custom-scrollbar rounded-2xl border border-white/10 bg-[#121212] shadow-2xl ring-1 ring-white/5">
                        
                        {!selectedCinema || rooms.length === 0 ? (
                            <div className="flex h-full items-center justify-center flex-col text-gray-500">
                                <Filter size={64} className="mb-4 opacity-20" />
                                <p className="text-xl font-bold">
                                    {!selectedCinema ? 'Vui lòng chọn rạp để xem lịch' : 'Rạp này chưa có phòng chiếu'}
                                </p>
                            </div>
                        ) : (
                            <div className="relative" style={{ minWidth: `${200 + TIMELINE_WIDTH}px` }}>
                                
                                {/* HEADER ROW */}
                                <div className="flex h-14 bg-[#18181b] border-b border-white/10 sticky top-0 z-40 shadow-md">
                                    <div className="sticky left-0 z-50 w-[200px] shrink-0 bg-[#18181b] border-r border-white/10 flex items-center justify-center font-bold text-gray-400 text-sm shadow-[4px_0_10px_rgba(0,0,0,0.3)]">
                                        Phòng Chiếu ({rooms.length})
                                    </div>

                                    <div className="flex-1 relative">
                                        {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
                                            const hour = (i + START_HOUR) % 24;
                                            return (
                                                <div 
                                                    key={i} 
                                                    className="absolute top-0 bottom-0 border-r border-white/5 flex items-center pl-2 text-xs font-mono text-gray-500 font-bold" 
                                                    style={{ 
                                                        left: `${i * PIXELS_PER_HOUR}px`, 
                                                        width: `${PIXELS_PER_HOUR}px` 
                                                    }}
                                                >
                                                    {String(hour).padStart(2, '0')}:00
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* ROOM ROWS */}
                                <div className="flex flex-col">
                                    {rooms.map((room) => (
                                        <div 
                                            key={room.room_id} 
                                            className="flex h-32 border-b border-white/5 relative group bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"
                                        >
                                            <div className="sticky left-0 z-30 w-[200px] shrink-0 bg-[#18181b] border-r border-white/10 flex flex-col justify-center px-5 shadow-[4px_0_10px_rgba(0,0,0,0.3)] group-hover:bg-[#202024] transition-colors">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Monitor size={16} className={room.name.includes('IMAX') ? 'text-yellow-500' : 'text-blue-500'} />
                                                    <span className="font-bold text-white text-sm truncate" title={room.name}>{room.name.replace(/ - (2D|3D|IMAX)/g, '')}</span>
                                                </div>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-xs text-gray-500">{room.seat_count} ghế</span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                                        room.name.includes('IMAX') 
                                                            ? 'bg-yellow-900/30 text-yellow-500' 
                                                            : 'bg-blue-900/30 text-blue-500'
                                                    }`}>
                                                        {room.type || '2D'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="relative flex-1 h-full">
                                                <div className="absolute inset-0 pointer-events-none">
                                                    {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                                                        <div 
                                                            key={i} 
                                                            className="absolute top-0 bottom-0 border-r border-white/5" 
                                                            style={{ left: `${i * PIXELS_PER_HOUR}px` }}
                                                        ></div>
                                                    ))}
                                                </div>

                                                {room.showtimes?.map(show => {
                                                    const isIMAX = room.name.includes('IMAX');
                                                    const leftPos = timeToPixels(show.start_time);
                                                    const widthSize = Math.max(durationToPixels(show.start_time, show.end_time), 100);

                                                    if (leftPos < 0 || leftPos > TIMELINE_WIDTH) return null;

                                                    return (
                                                        <div 
                                                            key={show.showtime_id}
                                                            className={`
                                                                absolute top-3 bottom-3 rounded-lg border shadow-lg cursor-pointer 
                                                                hover:brightness-125 hover:z-20 hover:scale-[1.02] transition-all 
                                                                flex flex-col justify-center px-3 overflow-hidden group/item
                                                                ${isIMAX 
                                                                    ? 'bg-gradient-to-br from-yellow-900/90 to-yellow-800/80 border-yellow-500/40 text-yellow-100 shadow-yellow-900/20' 
                                                                    : 'bg-gradient-to-br from-blue-900/90 to-blue-800/80 border-blue-500/40 text-blue-100 shadow-blue-900/20'}
                                                            `}
                                                            style={{ 
                                                                left: `${leftPos}px`, 
                                                                width: `${widthSize - 8}px` 
                                                            }}
                                                            title={`${show.movie?.title} (${formatTime(show.start_time)} - ${formatTime(show.end_time)})`}
                                                        >
                                                            <div className="font-bold text-sm truncate leading-tight mb-0.5 text-white drop-shadow-md">
                                                                {show.movie?.title}
                                                            </div>
                                                            <div className="flex items-center justify-between text-[11px] opacity-90 font-medium">
                                                                <div className="flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded">
                                                                    <Clock size={10}/> 
                                                                    {formatTime(show.start_time)} - {formatTime(show.end_time)}
                                                                </div>
                                                                <span className="font-bold text-white hidden xl:block">{show.price?.toLocaleString()}đ</span>
                                                            </div>

                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteShowtime(show.showtime_id); }}
                                                                className="absolute -top-1 -right-1 p-1.5 bg-red-600 text-white rounded-bl-lg opacity-0 group-hover/item:opacity-100 hover:bg-red-500 transition-all z-30"
                                                                title="Xóa suất chiếu"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 12px; height: 12px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #121212; border-bottom-right-radius: 1rem; border-bottom-left-radius: 1rem; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border: 3px solid #121212; border-radius: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }
                .custom-scrollbar::-webkit-scrollbar-corner { background: #121212; }
            `}</style>
        </AdminLayout>
    );
}