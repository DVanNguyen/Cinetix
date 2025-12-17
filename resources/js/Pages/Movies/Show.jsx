import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    ChevronLeft, Star, Clock, Calendar, Filter, MapPin, 
    ChevronDown, ChevronUp 
} from 'lucide-react';

export default function Show({ movie, cinemas, selectedDate }) {
    const [expandedCinema, setExpandedCinema] = useState(cinemas.length > 0 ? cinemas[0].id : null);

    // ✅ FIX: Lọc suất chiếu đã qua giờ (Frontend validation)
    const filteredCinemas = useMemo(() => {
        const now = new Date();
        const today = new Date().toISOString().split('T')[0];
        const isToday = selectedDate === today;

        if (!isToday) return cinemas; // Nếu không phải hôm nay, không cần lọc

        // Lọc suất chiếu chưa qua giờ
        return cinemas.map(cinema => ({
            ...cinema,
            formats: cinema.formats.map(format => ({
                ...format,
                rooms: format.rooms.map(room => ({
                    ...room,
                    showtimes: room.showtimes.filter(st => {
                        // Parse start_time từ backend
                        const showtimeDate = new Date(st.start_time);
                        return showtimeDate > now;
                    })
                })).filter(room => room.showtimes.length > 0) // Xóa room không còn suất
            })).filter(format => format.rooms.length > 0) // Xóa format không còn room
        })).filter(cinema => cinema.formats.length > 0); // Xóa rạp không còn suất
    }, [cinemas, selectedDate]);

    const formatDateVN = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return `${days[date.getDay()]}, ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    };

    // ✅ FIX: Kiểm tra suất chiếu trước khi booking
    const handleBooking = (showtimeId, startTime) => {
        if (!showtimeId) return;
        
        const showtimeDate = new Date(startTime);
        const now = new Date();
        
        if (showtimeDate <= now) {
            alert('Suất chiếu này đã bắt đầu hoặc đã qua. Vui lòng chọn suất khác.');
            return;
        }
        
        router.visit(`/booking/${showtimeId}/choose-seat`);
    };

    const toggleCinema = (id) => setExpandedCinema(expandedCinema === id ? null : id);

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
            <Head title={`Đặt vé - ${movie.title}`} />

            {/* HEADER */}
            <header className="relative h-64 md:h-80 overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center blur-sm scale-105" style={{ backgroundImage: `url('${movie.poster_url}')` }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/90 to-gray-950/60"></div>
                <div className="absolute inset-0 flex flex-col justify-end pb-6 px-4 container mx-auto z-10">
                    <div className="flex gap-6 items-end">
                        <img src={movie.poster_url} className="hidden md:block w-36 h-52 rounded-xl shadow-2xl border border-white/10 object-cover" />
                        <div>
                            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{movie.title}</h1>
                            <div className="flex items-center gap-4 text-sm md:text-base text-gray-300">
                                <span className="flex items-center gap-1 text-yellow-500 font-bold"><Star className="w-4 h-4" fill="currentColor" /> {movie.rating || '9.5'}</span>
                                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {movie.duration} phút</span>
                                <span className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded">T16</span>
                                <span>{movie.genre?.name}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-4 left-4 z-20">
                    <Link href="/" className="w-10 h-10 bg-white/10 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/20 transition text-white"><ChevronLeft /></Link>
                </div>
            </header>

            {/* NGÀY CHIẾU */}
            <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-30 shadow-2xl py-4">
                <div className="container mx-auto flex justify-center">
                    <div className="inline-flex items-center gap-3 bg-red-600/10 border border-red-600/50 px-6 py-2 rounded-full shadow-lg shadow-red-900/20">
                        <Calendar className="w-5 h-5 text-red-500" />
                        <span className="text-lg font-bold text-red-100 uppercase">{formatDateVN(selectedDate)}</span>
                    </div>
                </div>
            </div>

            {/* DANH SÁCH RẠP & SUẤT CHIẾU */}
            <div className="container mx-auto px-4 py-8 max-w-4xl pb-24">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold border-l-4 border-red-600 pl-4 text-white">Lịch chiếu</h2>
                    <button className="flex items-center gap-2 text-gray-400 text-sm font-bold bg-gray-800 px-4 py-2 rounded-full hover:bg-gray-700 transition"><Filter className="w-4 h-4" /> Lọc</button>
                </div>

                <div className="space-y-4">
                    {filteredCinemas.length > 0 ? (
                        filteredCinemas.map((cinema) => {
                            const isExpanded = expandedCinema === cinema.id;
                            return (
                                <div key={cinema.id} className={`bg-gray-900 rounded-xl border transition-all duration-300 ${isExpanded ? 'border-red-600/50 shadow-lg' : 'border-gray-800 hover:border-gray-700'}`}>
                                    <div onClick={() => toggleCinema(cinema.id)} className="p-5 cursor-pointer flex items-center justify-between hover:bg-gray-800/50 transition">
                                        <div>
                                            <h3 className={`font-bold text-lg mb-1 transition-colors ${isExpanded ? 'text-red-500' : 'text-white'}`}>{cinema.name}</h3>
                                            <p className="text-sm text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {cinema.address}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-gray-500 block mb-1">{cinema.distance}</span>
                                            {isExpanded ? <ChevronUp className="w-5 h-5 text-red-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="px-5 pb-6 border-t border-gray-800 animate-fade-in">
                                            {cinema.formats.map((format, fIdx) => (
                                                <div key={fIdx} className="mt-6 first:mt-4">
                                                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span> {format.type}
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {format.rooms.map((room, rIdx) => (
                                                            <div key={rIdx} className="bg-gray-950/50 p-4 rounded-xl border border-gray-800/50 flex flex-col sm:flex-row gap-4">
                                                                <div className="text-xs font-bold text-gray-500 uppercase min-w-[80px] pt-2">{room.name}</div>
                                                                <div className="flex flex-wrap gap-3">
                                                                    {room.showtimes.map((st) => {
                                                                        const isPrime = st.time >= '18:00' && st.time <= '22:00';
                                                                        return (
                                                                            <button 
                                                                                key={st.id} 
                                                                                onClick={() => handleBooking(st.id, st.start_time)}
                                                                                className={`min-w-[80px] px-3 py-2 rounded-lg border transition-all hover:scale-105 active:scale-95 group ${
                                                                                    isPrime 
                                                                                    ? 'bg-gray-800 border-red-500/30 text-white hover:bg-red-600 hover:border-red-600' 
                                                                                    : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white'
                                                                                }`}
                                                                            >
                                                                                <div className="text-sm font-bold text-center group-hover:text-white">{st.time}</div>
                                                                                <div className={`text-[10px] text-center mt-0.5 ${isPrime ? 'text-red-400 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                                                                    {st.price}
                                                                                </div>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-16 bg-gray-900/50 rounded-xl border border-dashed border-gray-700">
                            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">Không có suất chiếu nào vào ngày này hoặc tất cả suất đã qua giờ.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}