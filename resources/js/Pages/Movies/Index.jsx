import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { 
    PlayCircle, Search, MapPin, ChevronDown, Star, Clock, 
    Calendar, Filter, Ticket, LogOut, X, LayoutGrid,CalendarDays,
    Facebook, Instagram, Youtube, Mail, Phone, ChevronRight
} from 'lucide-react';

// Component Modal Trailer (Giữ nguyên)
const TrailerModal = ({ videoUrl, onClose }) => {
    if (!videoUrl) return null;
    const embedUrl = videoUrl.replace("watch?v=", "embed/");
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-red-500 bg-black/50 rounded-full p-2 transition z-20">
                    <X className="w-8 h-8" />
                </button>
                <iframe src={`${embedUrl}?autoplay=1`} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen></iframe>
            </div>
        </div>
    );
};

// --- COMPONENT CHÍNH ---
export default function Index({ movies, featureMovie, dateBar, filters }) {
    const { auth = {} } = usePage().props;

    // UI States
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showCityMenu, setShowCityMenu] = useState(false);
    const [showGenreMenu, setShowGenreMenu] = useState(false);
    const [playingTrailer, setPlayingTrailer] = useState(null);
    const [selectedCity, setSelectedCity] = useState('Hà Nội');

    // State Search
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    // Constants
    const cities = ['Hà Nội', 'TP.HCM', 'Đà Nẵng'];
    const genres = ['All', 'Hành động', 'Khoa học viễn tưởng', 'Kinh dị', 'Tình cảm', 'Hoạt hình', 'Hài', 'Tâm lý'];

    // --- XỬ LÝ DATE BAR (LẤY 7 NGÀY) ---
    // Giữ nút ALL (index 0) + 7 ngày tiếp theo (index 1-7) -> Tổng 8 item
    const shortDateBar = dateBar.slice(0, 8); 

    // --- HÀM XỬ LÝ FILTER CHUNG ---
    const updateFilters = (newParams) => {
        const params = { ...filters, ...newParams };
        if (params.genre === 'All') delete params.genre;
        if (!params.search) delete params.search;

        router.get('/', params, { 
            preserveState: true, 
            preserveScroll: true, 
            replace: true 
        });
    };

    const handleSearchSubmit = (e) => {
        if (e.key === 'Enter') updateFilters({ search: searchQuery });
    };

    const handleLogout = () => router.post('/logout');

    // Logic tính date cho Hero Banner
    const todayStr = new Date().toISOString().split('T')[0];
    const heroLinkDate = (filters.date && filters.date !== 'all') ? filters.date : todayStr;
    const heroLinkParam = `?date=${heroLinkDate}`;

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-red-600 selection:text-white" 
             onClick={() => {setShowCityMenu(false); setShowGenreMenu(false); setShowUserMenu(false);}}>
            
            <Head title="CineTix - Trang chủ" />

            {/* TRAILER MODAL */}
            {playingTrailer && <TrailerModal videoUrl={playingTrailer} onClose={() => setPlayingTrailer(null)} />}

            {/* --- HEADER --- */}
            <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 shadow-lg" onClick={e => e.stopPropagation()}>
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <PlayCircle className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white hidden sm:block">CineTix</span>
                    </Link>

                    <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
                        <input 
                            type="text" placeholder="Tìm kiếm phim" 
                            className="w-full bg-gray-800 border border-gray-700 text-gray-200 px-4 py-2 pl-10 rounded-full focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchSubmit}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button onClick={() => setShowCityMenu(!showCityMenu)} className="flex items-center gap-2 text-gray-300 hover:text-white transition">
                                <MapPin className="w-5 h-5 text-red-500" /> 
                                <span className="hidden sm:inline">{selectedCity}</span> 
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            {showCityMenu && (
                                <div className="absolute right-0 mt-2 w-40 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 overflow-hidden">
                                    {cities.map(c => (
                                        <button key={c} onClick={() => setSelectedCity(c)} className="w-full text-left px-4 py-2 hover:bg-gray-700">{c}</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {auth?.user ? (
                            <div className="relative">
                                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 text-white focus:outline-none">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-bold text-sm shadow-lg ring-2 ring-transparent hover:ring-red-500 transition-all">
                                        {auth.user.name.charAt(0)}
                                    </div>
                                    <span className="hidden sm:block truncate max-w-[100px] font-medium">{auth.user.name}</span>
                                </button>

                                {showUserMenu && (
                                    // Dropdown style Combo box
                                    <div className="absolute right-0 mt-3 w-56 bg-[#1a1a1e] rounded-xl border border-gray-700 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        {/* Header của menu */}
                                        <div className="px-4 py-3 border-b border-gray-700/50 bg-gray-800/30">
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Tài khoản</p>
                                            <p className="text-white font-bold truncate">{auth.user.name}</p>
                                        </div>

                                        {/* Danh sách các mục (Items) */}
                                        <div className="py-1">
                                            {/* Link đến trang Account */}
                                            <Link 
                                                href="/account" 
                                                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-700/50 text-gray-300 hover:text-white transition-colors"
                                                onClick={() => setShowUserMenu(false)} // Tự đóng menu khi click
                                            >
                                                <User className="w-4 h-4" /> 
                                                <span>Hồ sơ & Vé của tôi</span>
                                            </Link>

                                            {/* Nút Đăng xuất */}
                                            <button 
                                                onClick={handleLogout} 
                                                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-900/20 text-red-400 hover:text-red-300 transition-colors border-t border-gray-700/50"
                                            >
                                                <LogOut className="w-4 h-4" /> 
                                                <span>Đăng xuất</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link href="/login" className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-full font-bold text-sm transition shadow-lg shadow-red-900/20">
                                Đăng nhập
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* --- HERO SECTION --- */}
            <section className="relative h-[500px] overflow-hidden group">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] group-hover:scale-105"
                     style={{ backgroundImage: `url('${featureMovie.backdrop_url}')` }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent"></div>
                
                <div className="container mx-auto px-4 h-full flex items-end pb-16 relative z-10">
                    <div className="max-w-2xl animate-fade-in-up">
                        <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded mb-4 inline-block shadow">PHIM HOT HÔM NAY</span>
                        <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-2xl leading-tight">{featureMovie.title}</h1>
                        <div className="flex items-center gap-6 text-gray-200 text-lg mb-6">
                            <span className="flex items-center gap-1 text-yellow-400 font-bold"><Star className="w-5 h-5" fill="currentColor"/> {featureMovie.rating}</span>
                            <span className="flex items-center gap-1"><Clock className="w-5 h-5"/> {featureMovie.duration}</span>
                            <span className="bg-white/20 px-2 py-1 rounded text-sm">{featureMovie.genre}</span>
                        </div>
                        <div className="flex gap-4">
                            {featureMovie.trailer_url && (
                                <button onClick={() => setPlayingTrailer(featureMovie.trailer_url)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition shadow-lg">
                                    <PlayCircle className="w-6 h-6" /> Xem Trailer
                                </button>
                            )}
                            <Link href={`/movies/${featureMovie.id}${heroLinkParam}`} className="bg-white/10 border border-white/30 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition flex items-center gap-2">
                                <Ticket className="w-6 h-6" /> Đặt Vé
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- DATE BAR (7 NGÀY) --- */}
            <section className="container mx-auto px-4 relative z-20 mb-16">
                {/* Tăng padding và background đậm hơn để nổi bật */}
                <div className="bg-[#1a1c29]/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-4">
                    
                    {/* Flex container chính: gap rộng hơn, căn giữa */}
                    <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide py-2 px-2 snap-x">
                        
                        {/* 1. Nút ALL: Nhỏ gọn, Icon to */}
                        {shortDateBar.filter(d => d.isSpecial).map((d, i) => (
                            <button
                                key={`all-${i}`}
                                onClick={() => updateFilters({ date: d.fullValue })}
                                className={`
                                    flex flex-col items-center justify-center 
                                    min-w-[5rem] h-[6rem]  /* Kích thước cố định */
                                    rounded-2xl transition-all duration-300 flex-shrink-0 snap-start relative overflow-hidden
                                    ${d.isActive 
                                        ? 'bg-gray-100 text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105 font-black border-2 border-white z-10' 
                                        : 'bg-[#0b0c15] text-gray-400 hover:bg-gray-800 border border-white/10 hover:border-white/30'
                                    }
                                `}
                            >
                                <LayoutGrid className={`w-8 h-8 mb-1 ${d.isActive ? 'text-red-600' : 'text-gray-500'}`} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Tất cả</span>
                            </button>
                        ))}

                        {/* 2. Các Nút Ngày: To hơn, Giãn đều, Chữ rõ ràng */}
                        {shortDateBar.filter(d => !d.isSpecial).map((d, i) => {
                            const isSelected = d.isActive;
                            return (
                                <button 
                                    key={i} 
                                    onClick={() => updateFilters({ date: d.fullValue })}
                                    className={`
                                        relative flex-1 
                                        min-w-[6.5rem] h-[6rem] /* Chiều rộng tối thiểu để không bị đè */
                                        flex flex-col items-center justify-center 
                                        rounded-2xl transition-all duration-300 group snap-start overflow-hidden
                                        ${isSelected 
                                            ? 'bg-gradient-to-b from-red-600 to-rose-900 shadow-[0_0_25px_rgba(225,29,72,0.6)] border border-rose-400 scale-105 -translate-y-1 z-10' 
                                            : 'bg-[#0b0c15]/60 backdrop-blur border border-white/5 hover:bg-white/10 hover:border-white/20'
                                        }
                                    `}
                                >
                                    {/* Thứ (Nhỏ phía trên) */}
                                    <span className={`text-[10px] uppercase font-bold tracking-widest mb-0.5 ${isSelected ? 'text-red-100' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                        {d.dayName}
                                    </span>
                                    
                                    {/* Ngày (Số RẤT TO ở giữa) */}
                                    <span className={`text-3xl font-black leading-none mb-0.5 ${isSelected ? 'text-white drop-shadow-md' : 'text-gray-200 group-hover:text-white'}`}>
                                        {d.date}
                                    </span>
                                    
                                    {/* Tháng (Nhỏ phía dưới) */}
                                    <span className={`text-[10px] font-medium ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                                        Thg {d.month}
                                    </span>

                                    {/* Hiệu ứng Shine nhẹ khi hover (chỉ hiện khi chưa chọn) */}
                                    {!isSelected && <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* --- LOCATION INFO --- */}
            <div className="container mx-auto px-4">
                <div className="flex items-center gap-3">
                    <span className="text-red-600 font-black text-2xl leading-none">|</span>
                    <span className="text-gray-400 text-sm font-medium flex items-center gap-2">
                        Phim được chiếu tại <span className="text-white font-bold text-base">{selectedCity}</span>
                        <MapPin className="w-4 h-4 text-red-500" />
                    </span>
                </div>
            </div>

            {/* --- FILTER & GRID --- */}
            <section className="container mx-auto px-4 mt-10 pb-20">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800">
                        <button onClick={() => updateFilters({ status: 'now_showing' })} 
                            className={`px-6 py-2 rounded-lg font-bold text-sm transition ${filters.status === 'now_showing' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                            Đang Chiếu
                        </button>
                        <button onClick={() => updateFilters({ status: 'coming_soon' })} 
                            className={`px-6 py-2 rounded-lg font-bold text-sm transition ${filters.status === 'coming_soon' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                            Sắp Chiếu
                        </button>
                    </div>
                    <div className="relative z-30">
                        <button onClick={(e) => { e.stopPropagation(); setShowGenreMenu(!showGenreMenu); }} className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-xl border border-gray-700 font-bold text-sm hover:border-gray-500 transition">
                            <Filter className="w-4 h-4 text-red-500" />
                            <span>{filters.genre || 'Tất cả thể loại'}</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>
                        {showGenreMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden max-h-60 overflow-y-auto">
                                {genres.map(g => (
                                    <button key={g} onClick={() => { updateFilters({ genre: g }); setShowGenreMenu(false); }} 
                                        className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-800 transition ${filters.genre === g ? 'text-red-500 font-bold' : 'text-gray-300'}`}>
                                        {g}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* GRID PHIM */}
                {movies.length === 0 ? (
                    <div className="text-center py-20 bg-gray-900/30 rounded-2xl border border-dashed border-gray-800">
                        <p className="text-gray-500 text-lg">Không có phim nào trong ngày này.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 xl:grid-cols-6 gap-6 2xl:grid-cols-7 gap-7">
                        {movies.map(movie => {
                            // --- LOGIC TÍNH NGÀY ĐỂ FIX LỖI REFERENCE ERROR ---
                            let linkDate;
                            const today = new Date().toISOString().split('T')[0];

                            if (filters.date && filters.date !== 'all') {
                                linkDate = filters.date;
                            } else {
                                // Nếu ALL: Phim chưa chiếu -> Link tới ngày release. Phim đang chiếu -> Link hôm nay.
                                if (movie.release_date && movie.release_date > today) {
                                    linkDate = movie.release_date;
                                } else {
                                    linkDate = today;
                                }
                            }
                            // -----------------------------------------------

                            return (
                                <div key={movie.id} className="group flex flex-col bg-gray-900 rounded-2xl overflow-hidden shadow-lg border border-gray-800 hover:border-gray-600 hover:shadow-red-900/20 transition-all duration-300 hover:-translate-y-2">
                                    <div className="relative aspect-[2/3] overflow-hidden bg-gray-800">
                                        <div className="absolute top-2 left-2 z-10">
                                            <span className="px-2 py-1 bg-orange-600 text-white text-[10px] font-bold rounded shadow">T16</span>
                                        </div>
                                        <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                                        
                                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4 backdrop-blur-[2px]">
                                            <Link href={`/movies/${movie.id}?date=${linkDate}`} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-sm text-center shadow-lg transition">
                                                <Calendar className="w-4 h-4 inline mr-1" /> Đặt Vé
                                            </Link>
                                            {movie.trailer_url && (
                                                <button onClick={() => setPlayingTrailer(movie.trailer_url)} className="w-full border border-gray-400 hover:bg-white hover:text-black text-white font-bold py-2 rounded-lg text-sm text-center transition">
                                                    <PlayCircle className="w-4 h-4 inline mr-1" /> Trailer
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg flex items-center gap-1">
                                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                            <span className="text-xs font-bold text-white">{movie.rating}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col flex-1">
                                        <h3 className="font-bold text-white text-base line-clamp-1 mb-1 group-hover:text-red-500 transition" title={movie.title}>
                                            {movie.title}
                                        </h3>
                                        <div className="flex justify-between text-xs text-gray-400 mb-3">
                                            <span className="truncate max-w-[70%]">{movie.genre}</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3"/> {movie.duration}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* --- FOOTER MỚI --- */}
            <footer className="bg-gray-900 border-t border-gray-800 pt-16 pb-8">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                        {/* Cột 1 */}
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-900/20">C</div>
                                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">CineTix</span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                Hệ thống đặt vé xem phim trực tuyến hàng đầu. Trải nghiệm điện ảnh đỉnh cao mọi lúc, mọi nơi.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition"><Facebook size={18} /></a>
                                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-pink-600 hover:text-white transition"><Instagram size={18} /></a>
                                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition"><Youtube size={18} /></a>
                            </div>
                        </div>
                        {/* Cột 2 */}
                        <div>
                            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Về chúng tôi</h4>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-red-500 transition">Giới thiệu</a></li>
                                <li><a href="#" className="hover:text-red-500 transition">Tuyển dụng</a></li>
                                <li><a href="#" className="hover:text-red-500 transition">Liên hệ quảng cáo</a></li>
                            </ul>
                        </div>
                        {/* Cột 3 */}
                        <div>
                            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Điều khoản</h4>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-red-500 transition">Điều khoản chung</a></li>
                                <li><a href="#" className="hover:text-red-500 transition">Chính sách bảo mật</a></li>
                                <li><a href="#" className="hover:text-red-500 transition">Câu hỏi thường gặp</a></li>
                            </ul>
                        </div>
                        {/* Cột 4 */}
                        <div>
                            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Hỗ trợ</h4>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 text-gray-400 text-sm">
                                    <MapPin size={18} className="text-red-500 mt-1 shrink-0" />
                                    <span>Tầng 6, Lotte Center, 54 Liễu Giai, Hà Nội</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400 text-sm">
                                    <Phone size={18} className="text-red-500 shrink-0" />
                                    <span>1900 6017 (1000đ/phút)</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400 text-sm">
                                    <Mail size={18} className="text-red-500 shrink-0" />
                                    <span>support@cinetix.vn</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-gray-500 text-xs">© 2025 CineTix. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}