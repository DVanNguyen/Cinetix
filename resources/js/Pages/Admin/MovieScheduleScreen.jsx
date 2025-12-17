import { Head, router } from '@inertiajs/react';
import AdminLayout from "@/Pages/Layouts/AdminLayout";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Save, Calendar, Star, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import React, { useState, useEffect } from 'react';

export default function MovieScheduleScreen({ dates = [], allMovies = [] }) {
    // 1. STATE QUẢN LÝ
    const safeDates = Array.isArray(dates) ? dates : [];
    const safeAllMovies = Array.isArray(allMovies) ? allMovies : [];

    // --- TẦNG BẢO VỆ 2: OBJECT MẶC ĐỊNH (FALLBACK) ---
    // Object rỗng để dùng khi chưa chọn ngày hoặc danh sách ngày bị rỗng
    const emptyDayData = { 
        date: '', 
        display: 'Chưa chọn', 
        movies: [], 
        source: '' 
    };

    // 1. STATE
    const [selectedDateIndex, setSelectedDateIndex] = useState(0); 

    // 2. LẤY DATA NGÀY HIỆN TẠI (Dùng optional chaining ?. để tránh lỗi)
    // Nếu safeDates[0] không có -> dùng emptyDayData
    const currentDateData = safeDates[selectedDateIndex] || emptyDayData;

    // 3. STATE LIST PHIM (Luôn đảm bảo là mảng)
    const [currentMovies, setCurrentMovies] = useState(currentDateData.movies || []);

    // 4. EFFECT: ĐỒNG BỘ KHI ĐỔI NGÀY
    useEffect(() => {
        // Mỗi khi index thay đổi, cập nhật lại list phim
        // Nếu ngày đó chưa có phim -> gán mảng rỗng []
        setCurrentMovies(currentDateData.movies || []);
    }, [selectedDateIndex, safeDates]);


    // 2. HÀM KÉO THẢ (Drag & Drop Logic)
    const onDragEnd = (result) => {
        if (!result.destination) return; // Kéo ra ngoài thì thôi

        const items = Array.from(currentMovies);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setCurrentMovies(items);
    };

    // 3. HÀM THÊM PHIM (Từ kho phim bên phải)
    const addMovieToSchedule = (movie) => {
        // Kiểm tra trùng
        if (currentMovies.find(m => m.movie_id === movie.movie_id)) {
            alert('Phim này đã có trong danh sách!');
            return;
        }
        setCurrentMovies([...currentMovies, movie]);
    };

    // 4. HÀM XÓA PHIM
    const removeMovie = (index) => {
        const newMovies = [...currentMovies];
        newMovies.splice(index, 1);
        setCurrentMovies(newMovies);
    };

    // 5. HÀM LƯU LỊCH (Gửi về Server)
    const saveSchedule = () => {
        // Đảm bảo lấy đúng chuỗi ngày (VD: '2024-12-16')
        const dateParam = currentDateData.date; 


        // SỬA 1: Đổi router.post -> router.put (Vì bên Laravel khai báo Route::put)
        // SỬA 2: Đổi URL từ /admin/schedule -> /admin/movie-schedule
        router.put(
            `/admin/movie-schedule/${dateParam}`, 
            {
                movies: currentMovies
            },
            {
                onSuccess: () => alert('Đã lưu lịch thành công!'),
                onError: (err) => {
                    console.error(err);
                    alert('Lỗi khi lưu lịch! Hãy kiểm tra Console (F12).');
                }
            }
        );
};

    // 6. HÀM ĐỔI NGÀY
    const changeDate = (index) => {
        setSelectedDateIndex(index);
        setCurrentMovies(dates[index].movies || []); // Reset list phim theo ngày mới
    };

    return (
        <AdminLayout title="Xếp Lịch Chiếu Phim">
            <Head title="Xếp Lịch" />

            <div className="flex gap-6 h-[calc(100vh-140px)]">
                
                {/* CỘT 1: DANH SÁCH 14 NGÀY (SIDEBAR TRÁI) */}
                <div className="w-64 bg-gray-900 rounded-xl border border-gray-800 shadow-xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-800 font-bold text-gray-400">Chọn Ngày</div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {dates.map((d, idx) => (
                            <button
                                key={d.date}
                                onClick={() => changeDate(idx)}
                                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                                    idx === selectedDateIndex 
                                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg' 
                                    : 'bg-gray-800 text-gray-400 border-transparent hover:bg-gray-700'
                                }`}
                            >
                                <div className="font-bold flex justify-between">
                                    {d.display}
                                    {/* Icon nhỏ báo hiệu nguồn dữ liệu */}
                                    {d.source === 'auto' && <span title="Tự động" className="text-xs bg-purple-500/20 text-purple-400 px-1 rounded">Auto</span>}
                                </div>
                                <div className="text-xs opacity-70 mt-1">{d.movies.length} phim</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* CỘT 2: KHU VỰC KÉO THẢ (MAIN) */}
                <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 shadow-xl flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Calendar className="text-blue-500"/> 
                                Lịch Ngày: <span className="text-blue-400">{currentDateData.display}</span>
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                {currentDateData.source === 'auto' 
                                    ? '⚠️ Đây là lịch gợi ý tự động. Hãy chỉnh sửa và bấm Lưu để chốt.' 
                                    : '✅ Lịch này đã được lưu trong Database.'}
                            </p>
                        </div>
                        <button 
                            onClick={saveSchedule}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-green-900/20 flex items-center gap-2 transition-all"
                        >
                            <Save size={18} /> Lưu Thay Đổi
                        </button>
                    </div>

                    {/* Drag & Drop Area */}
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="schedule-list">
                            {(provided) => (
                                <div 
                                    {...provided.droppableProps} 
                                    ref={provided.innerRef} 
                                    className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-900/50"
                                >
                                    {currentMovies.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">
                                            <AlertCircle size={48} className="mb-2 opacity-50"/>
                                            <p>Chưa có phim nào. Hãy chọn từ danh sách bên phải.</p>
                                        </div>
                                    )}

                                    {currentMovies.map((movie, index) => (
                                        <Draggable key={movie.movie_id} draggableId={String(movie.movie_id)} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`flex items-center gap-4 p-3 rounded-lg border shadow-sm ${
                                                        snapshot.isDragging 
                                                        ? 'bg-blue-900 border-blue-500 z-50' 
                                                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                                    }`}
                                                >
                                                    <div className="font-bold text-gray-500 w-6 text-center">#{index + 1}</div>
                                                    <img src={movie.poster_url} className="w-10 h-14 rounded object-cover" />
                                                    <div className="flex-1">
                                                        <div className="font-bold text-white">{movie.title}</div>
                                                        <div className="text-xs text-yellow-500 flex items-center gap-1">
                                                            <Star size={10} fill="currentColor"/> {movie.rating}
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => removeMovie(index)}
                                                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-700 rounded transition-colors"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>

                {/* CỘT 3: KHO PHIM (SIDEBAR PHẢI) */}
                <div className="w-80 bg-gray-900 rounded-xl border border-gray-800 shadow-xl flex flex-col">
                    <div className="p-4 border-b border-gray-800 font-bold text-gray-400">Kho Phim ({allMovies.length})</div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {allMovies.map(movie => (
                            <div key={movie.movie_id} className="flex gap-3 p-2 rounded-lg hover:bg-gray-800 border border-transparent hover:border-gray-700 group transition-all">
                                <img src={movie.poster_url} className="w-12 h-16 rounded object-cover" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm text-gray-200 truncate" title={movie.title}>{movie.title}</div>
                                    <div className="text-xs text-yellow-500 mt-1">{movie.rating} ★</div>
                                    <button 
                                        onClick={() => addMovieToSchedule(movie)}
                                        className="mt-2 text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30 hover:bg-blue-600 hover:text-white w-full transition-colors"
                                    >
                                        + Thêm vào lịch
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}