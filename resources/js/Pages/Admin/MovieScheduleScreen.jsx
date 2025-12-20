import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Pages/Layouts/AdminLayout';
import { 
    Save, Calendar, Star, Clock, AlertCircle, RefreshCw, 
    Search, Plus, Trash2, GripVertical, Film, ChevronDown, MapPin 
} from 'lucide-react';

export default function MovieScheduleScreen({ dates = [], allMovies = [] }) {
    
    // --- STATE QUẢN LÝ ---
    // Đảm bảo dữ liệu luôn là mảng để tránh lỗi .map()
    const safeDates = Array.isArray(dates) ? dates : [];
    const safeAllMovies = Array.isArray(allMovies) ? allMovies : [];
    
    // Object mặc định phòng khi dữ liệu ngày bị thiếu
    const emptyDayData = { date: '', display: 'Chưa chọn', movies: [], source: '' };
    
    const [selectedDateIndex, setSelectedDateIndex] = useState(0);
    const currentDateData = safeDates[selectedDateIndex] || emptyDayData;
    
    // List phim của ngày hiện tại (đang thao tác)
    const [currentMovies, setCurrentMovies] = useState(currentDateData.movies || []);
    
    const [searchTerm, setSearchTerm] = useState(""); 
    const [isSaving, setIsSaving] = useState(false);

    // Effect: Đồng bộ dữ liệu khi người dùng đổi ngày
    useEffect(() => {
        setCurrentMovies(currentDateData.movies || []);
    }, [selectedDateIndex, safeDates]);

    // --- LOGIC KÉO THẢ (HTML5 Native Drag & Drop) ---
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);

    const handleDragStart = (e, index) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Có thể set drag image tùy chỉnh ở đây nếu cần
    };

    const handleDragOver = (e, index) => {
        e.preventDefault(); // Cần thiết để cho phép drop
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        if (draggedItemIndex === null) return;

        const items = [...currentMovies];
        const itemToMove = items[draggedItemIndex];
        
        // Xóa item ở vị trí cũ
        items.splice(draggedItemIndex, 1);
        // Chèn vào vị trí mới
        items.splice(targetIndex, 0, itemToMove);
        
        setCurrentMovies(items);
        setDraggedItemIndex(null);
    };

    // --- LOGIC CRUD ---
    const addMovieToSchedule = (movie) => {
        if (currentMovies.find(m => m.movie_id === movie.movie_id)) {
            alert('⚠️ Phim này đã có trong danh sách chiếu ngày hôm nay!');
            return;
        }
        setCurrentMovies([...currentMovies, movie]);
    };

    const removeMovie = (index) => {
        const newMovies = [...currentMovies];
        newMovies.splice(index, 1);
        setCurrentMovies(newMovies);
    };

    const saveSchedule = () => {
        if (!currentDateData.date) return alert("Lỗi: Không xác định được ngày!");

        setIsSaving(true);
        
        // Gửi request PUT lên server để lưu
        router.put(
            `/admin/movie-schedule/${currentDateData.date}`,
            { movies: currentMovies },
            {
                onSuccess: () => {
                    setIsSaving(false);
                    // Hiển thị thông báo (Có thể dùng Toast nếu project có sẵn)
                    alert(`✅ Đã lưu lịch chiếu cho ngày ${currentDateData.display} thành công!`);
                },
                onError: (err) => {
                    setIsSaving(false);
                    console.error(err);
                    alert('❌ Lỗi khi lưu lịch! Vui lòng kiểm tra lại.');
                }
            }
        );
    };

    // Filter phim trong kho theo từ khóa tìm kiếm
    const filteredLibrary = safeAllMovies.filter(movie => 
        movie.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout title="Xếp Lịch Chiếu Phim">
            <Head title="Xếp Lịch Chiếu" />

            {/* Layout Flex chính: h-screen để full màn hình, overflow-hidden để cuộn từng phần */}
            <div className="flex h-screen flex-col md:flex-row overflow-hidden bg-gray-950">
                
                {/* --- CỘT 2: KHU VỰC CHÍNH (SCHEDULE MAIN) --- */}
                <div className="flex-1 flex flex-col bg-gray-950 relative">
                    
                    {/* Header Toolbar */}
                    <div className="h-20 border-b border-gray-800 bg-gray-900/90 backdrop-blur-md flex justify-between items-center px-6 sticky top-0 z-10 gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            
                            {/* COMBOBOX CHỌN NGÀY */}
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-red-500 group-hover:text-red-400 transition-colors">
                                    <Calendar size={20} />
                                </div>
                                <select
                                    value={selectedDateIndex}
                                    onChange={(e) => setSelectedDateIndex(Number(e.target.value))}
                                    className="appearance-none bg-gray-800 border border-gray-700 text-white pl-10 pr-10 py-2.5 rounded-xl font-bold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all cursor-pointer min-w-[240px] hover:bg-gray-700"
                                >
                                    {safeDates.map((d, idx) => (
                                        <option key={d.date} value={idx}>
                                            {d.display} {d.source === 'auto' ? '• (Auto)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                    <ChevronDown size={16} />
                                </div>
                            </div>

                            <div className="hidden lg:block h-8 w-px bg-gray-700 mx-2"></div>

                            <div className="hidden lg:block">
                                <p className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                    <MapPin size={14} className="text-gray-500"/> Quản lý lịch chiếu
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {currentMovies.length} phim được xếp
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {currentDateData.source === 'auto' && (
                                <div className="hidden sm:flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">
                                    <AlertCircle size={14} />
                                    <span>Gợi ý tự động</span>
                                </div>
                            )}
                            <button 
                                onClick={saveSchedule}
                                disabled={isSaving}
                                className="bg-white text-black hover:bg-gray-200 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/5 active:scale-95"
                            >
                                {isSaving ? <RefreshCw size={18} className="animate-spin"/> : <Save size={18} />}
                                {isSaving ? 'Đang lưu...' : 'Lưu Lịch'}
                            </button>
                        </div>
                    </div>

                    {/* Schedule Canvas (Drag & Drop Area) */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed">
                        {currentMovies.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900/50 p-10 text-center">
                                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                    <Film size={40} className="text-gray-500 opacity-50" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-300">Chưa có phim nào</h3>
                                <p className="text-gray-500 mt-2 max-w-xs">Chọn phim từ danh sách bên phải và bấm dấu (+) để thêm vào lịch chiếu ngày này.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-w-4xl mx-auto">
                                {currentMovies.map((movie, index) => (
                                    <div
                                        key={`${movie.movie_id}-${index}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDrop={(e) => handleDrop(e, index)}
                                        className="group relative flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl p-3 hover:border-red-500/50 transition-all shadow-lg hover:shadow-red-900/10 cursor-move"
                                    >
                                        {/* Drag Handle */}
                                        <div className="text-gray-600 group-hover:text-gray-400 cursor-grab active:cursor-grabbing px-1">
                                            <GripVertical size={20} />
                                        </div>

                                        {/* Order Badge */}
                                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center font-bold text-gray-400 text-sm border border-gray-700">
                                            {index + 1}
                                        </div>

                                        {/* Movie Poster */}
                                        <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-gray-700 relative">
                                            <img src={movie.poster_url} className="w-full h-full object-cover" alt={movie.title} />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                        </div>

                                        {/* Movie Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-white text-base truncate pr-4">{movie.title}</h3>
                                            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                                <span className="flex items-center gap-1 bg-gray-800 px-2 py-0.5 rounded text-gray-300">
                                                    <Clock size={12}/> {movie.duration || 'N/A'}
                                                </span>
                                                <span className="flex items-center gap-1 text-yellow-500">
                                                    <Star size={12} fill="currentColor"/> {movie.rating || '0.0'}
                                                </span>
                                                {movie.genre && <span>• {movie.genre}</span>}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pr-2">
                                            <button 
                                                onClick={() => removeMovie(index)}
                                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Xóa khỏi lịch"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- CỘT 3: KHO PHIM (SIDEBAR PHẢI) --- */}
                <div className="w-full md:w-80 bg-gray-900 border-l border-gray-800 flex flex-col z-20 shadow-2xl">
                    <div className="p-5 border-b border-gray-800">
                        <h2 className="font-bold text-white mb-3 flex items-center justify-between">
                            Kho Phim
                            <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full text-gray-300">{safeAllMovies.length}</span>
                        </h2>
                        {/* Search Box */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input 
                                type="text" 
                                placeholder="Tìm tên phim..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-800 border border-transparent focus:border-red-500 text-gray-200 text-sm rounded-lg pl-9 pr-3 py-2.5 outline-none transition-all placeholder-gray-600 focus:ring-1 focus:ring-red-500"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                        {filteredLibrary.length > 0 ? filteredLibrary.map(movie => (
                            <div key={movie.movie_id} className="group flex gap-3 p-2 rounded-xl hover:bg-gray-800 border border-transparent hover:border-gray-700 transition-all relative">
                                <div className="w-14 h-20 rounded-lg overflow-hidden shadow-sm flex-shrink-0 relative">
                                    <img src={movie.poster_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Poster" />
                                    {/* Quick Add Overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button 
                                            onClick={() => addMovieToSchedule(movie)}
                                            className="text-white bg-red-600 p-1.5 rounded-full hover:scale-110 transition-transform shadow-lg"
                                            title="Thêm vào lịch"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h4 className="font-bold text-sm text-gray-200 truncate group-hover:text-white transition-colors" title={movie.title}>
                                        {movie.title}
                                    </h4>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                                        <span>{movie.duration || 'N/A'}</span>
                                        <span>•</span>
                                        <span className="text-yellow-600 flex items-center gap-0.5"><Star size={8} fill="currentColor"/> {movie.rating || '0.0'}</span>
                                    </div>
                                    
                                    {/* Nút thêm cho Mobile (hoặc khi không hover) */}
                                    <button 
                                        onClick={() => addMovieToSchedule(movie)}
                                        className="mt-2 text-[10px] font-bold text-blue-400 border border-blue-500/30 bg-blue-500/10 px-2 py-1 rounded hover:bg-blue-500 hover:text-white transition-colors w-fit group-hover:hidden"
                                    >
                                        + Thêm
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-gray-600 text-xs">
                                <p>Không tìm thấy phim nào.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Custom Scrollbar Styles (Màu xám/tối) */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
            `}</style>
        </AdminLayout>
    );
}