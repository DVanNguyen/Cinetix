import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Pages/Layouts/AdminLayout';
import { Plus, Search, Edit, Trash2, Calendar, Star, Clock, Film } from 'lucide-react';

// Component con: Thẻ Phim Dọc
const MovieCard = ({ movie, onEdit, onDelete }) => (
    <div className="group relative bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-lg hover:shadow-red-900/20 hover:border-red-500/50 transition-all duration-300">
        {/* Poster Ảnh */}
        <div className="aspect-[2/3] w-full overflow-hidden relative">
            <img 
                src={movie.poster_url} 
                alt={movie.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {/* Badge Trạng Thái */}
            <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase backdrop-blur-md ${
                    movie.status === 'now_showing' ? 'bg-green-500/80 text-white' :
                    movie.status === 'coming_soon' ? 'bg-yellow-500/80 text-black' :
                    'bg-red-500/80 text-white'
                }`}>
                    {movie.status === 'now_showing' ? 'Đang chiếu' : 
                     movie.status === 'coming_soon' ? 'Sắp chiếu' : 'Đã đóng'}
                </span>
            </div>
            
            {/* Action Buttons (Hiện khi hover) */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                <button 
                    onClick={() => onEdit(movie)}
                    className="p-3 bg-blue-600 rounded-full text-white hover:bg-blue-500 hover:scale-110 transition-all"
                    title="Chỉnh sửa"
                >
                    <Edit size={20} />
                </button>
                <button 
                    onClick={() => onDelete(movie.movie_id)}
                    className="p-3 bg-red-600 rounded-full text-white hover:bg-red-500 hover:scale-110 transition-all"
                    title="Xóa phim"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </div>

        {/* Thông tin phim */}
        <div className="p-4">
            <h3 className="text-white font-bold text-lg truncate mb-1" title={movie.title}>{movie.title}</h3>
            
            <div className="flex items-center justify-between text-gray-400 text-sm mb-3">
                <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{movie.duration}p</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                    <Star size={14} fill="currentColor" />
                    <span className="font-bold">{movie.rating}</span>
                </div>
            </div>

            <div className="text-xs text-gray-500 line-clamp-1">
                {movie.genre?.name || 'Chưa cập nhật thể loại'}
            </div>
        </div>
    </div>
);

export default function MovieAdminScreen({ movies = [], dateList = [], currentDate = 'all' }) {
    const [searchQuery, setSearchQuery] = useState('');

    // Xử lý chuyển ngày
    const handleDateChange = (date) => {
        router.get(
            `/admin/movies?date=${date}`,
            {},
            { preserveState: true, preserveScroll: true }
        );
    };

    // Filter client-side cho tìm kiếm
    const filteredMovies = movies.filter(movie => 
        movie.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

        // Xử lý xóa (Demo)
        const handleDelete = (id) => {
            if(confirm('Bạn có chắc muốn xóa phim này?')) {
            router.get(
            window.route('admin.movies.index'),
            { date: currentDate },
            { preserveState: true, preserveScroll: true }
        );        
    }


    };

    // Xử lý sửa (Demo)
    const handleEdit = (movie) => {
        // Logic mở modal sửa hoặc chuyển trang
        console.log("Edit", movie);
    };

    return (
        <AdminLayout title="Quản Lý Kho Phim">
            <Head title="Admin - Phim" />

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* 1. THANH CÔNG CỤ (Tìm kiếm & Thêm mới) */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-lg">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm phim..." 
                            className="w-full bg-gray-800 border border-gray-700 text-gray-300 px-4 py-2 pl-10 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-red-900/20">
                        <Plus size={18} /> Thêm phim mới
                    </button>
                </div>

                {/* 2. THANH CHỌN NGÀY (14 NGÀY) */}
                <div className="relative">
    {/* Fade effect 2 bên để cảm giác danh sách dài vô tận */}
    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-950 to-transparent z-10 pointer-events-none"></div>
    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-950 to-transparent z-10 pointer-events-none"></div>

    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-2 shadow-xl mb-6">
    <div className="flex gap-3 overflow-x-auto pb-2 pt-1 px-1 custom-scrollbar select-none snap-x">
        {(dateList || []).map((item) => {
            const isActive = currentDate === item.date;
            
            return (
                <button
                    key={item.date}
                    onClick={() => handleDateChange(item.date)}
                    className={`
                        relative group flex flex-col items-center justify-center 
                        min-w-[100px] h-[80px] flex-shrink-0 rounded-xl border transition-all duration-300 snap-start
                        ${isActive 
                            ? 'bg-gradient-to-b from-red-600 to-red-700 border-red-500 shadow-lg shadow-red-900/40 translate-y-0 z-10' 
                            : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-800 hover:border-gray-600 hover:text-gray-200'
                        }
                    `}
                >
                    {/* Phần Thứ (hoặc nhãn ALL/Hôm nay) */}
                    <span className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${isActive ? 'text-red-100' : 'text-gray-500'}`}>
                        {item.day}
                    </span>

                    {/* Phần Ngày */}
                    <span className={`text-xl font-black ${
                        isActive ? 'text-white' : 
                        (item.isWeekend ? 'text-yellow-500' : 'text-gray-300')
                    }`}>
                        {item.date === 'all' ? 'ALL' : item.display}
                    </span>

                    {/* Chỉ báo cuối tuần (Dấu chấm nhỏ góc phải) */}
                    {item.isWeekend && !isActive && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-yellow-500/50"></div>
                    )}
                </button>
            );
        })}
    </div>
</div>
</div>

                {/* 3. LƯỚI PHIM (GRID VIEW) */}
                {filteredMovies.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 ">
                        {filteredMovies.map(movie => (
                            <MovieCard 
                                key={movie.movie_id} 
                                movie={movie} 
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-gray-900/50 rounded-xl border border-gray-800 border-dashed">
                        <Film size={48} className="mb-4 opacity-50" />
                        <p className="text-lg">Không tìm thấy phim nào cho ngày này.</p>
                        {currentDate !== 'all' && (
                            <button 
                                onClick={() => handleDateChange('all')}
                                className="mt-2 text-red-500 hover:underline"
                            >
                                Xem tất cả phim
                            </button>
                        )}
                    </div>
                )}
            </div>
            
            {/* CSS Scrollbar ẩn cho đẹp */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
            `}</style>
        </AdminLayout>
    );
}