import React, { useState, useEffect, useMemo } from 'react'; 
import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, X, MapPin, Calendar, Clock, Armchair, ArrowRight, Monitor, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function ChooseSeat({ 
    showtime,
    movie,
    room,
    cinema, 
    seats, 
    soldSeatIds: initialSold, 
    lockedSeatIds: initialLocked,
    lockedSeatsWithExpiry,
    mySelectedSeatIds, // ✅ NEW: Ghế đang chọn của mình
    combos 
}) {
    
    const [realtimeSold, setRealtimeSold] = useState(initialSold);
    const [realtimeLocked, setRealtimeLocked] = useState(initialLocked);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [selectedCombos, setSelectedCombos] = useState({});
    const [isShowtimePast, setIsShowtimePast] = useState(false);

    // ✅ FIX 2: Restore ghế đã chọn từ server sau khi F5
    useEffect(() => {
        if (!mySelectedSeatIds || mySelectedSeatIds.length === 0 || !seats) return;

        const PRICE_STANDARD = 90000;
        const PRICE_VIP = 120000;
        const PRICE_COUPLE = 240000;

        const restoredSeats = mySelectedSeatIds.map(seatId => {
            const seat = seats.find(s => (s.seat_id || s.id) === seatId);
            if (!seat) return null;

            let price = PRICE_STANDARD;
            if (seat.seat_type === 'vip') price = PRICE_VIP;
            if (seat.seat_type === 'couple') price = PRICE_COUPLE;

            return {
                id: seatId,
                row: seat.seat_row,
                num: seat.seat_number,
                type: seat.seat_type,
                price: price
            };
        }).filter(Boolean);

        console.log('🔄 Restore ghế sau F5:', restoredSeats);
        setSelectedSeats(restoredSeats);
    }, [mySelectedSeatIds, seats]);

    // Kiểm tra suất chiếu đã qua giờ
    useEffect(() => {
        const checkShowtimeStatus = () => {
            const showtimeStart = new Date(showtime.start_time);
            const now = new Date();
            const diffMinutes = Math.floor((showtimeStart - now) / 1000 / 60);
            
            if (diffMinutes <= 15) {
                setIsShowtimePast(true);
                alert('Suất chiếu này sắp bắt đầu. Bạn sẽ được chuyển về trang chọn suất.');
                setTimeout(() => {
                    router.visit(`/movies/${movie.movie_id}`);
                }, 2000);
            }
        };

        checkShowtimeStatus();
        const interval = setInterval(checkShowtimeStatus, 30000);
        return () => clearInterval(interval);
    }, [showtime.start_time, movie.movie_id]);

    // Polling API
    useEffect(() => {
        if (!showtime?.showtime_id || isShowtimePast) return;

        const pollSeatStatus = async () => {
            try {
                const response = await axios.get(`/showtimes/${showtime.showtime_id}/seat-status`);
                const data = response.data;
                
                setRealtimeSold(data.soldSeatIds || []);
                setRealtimeLocked(data.lockedSeatIds || []);
                
                // Tự động bỏ chọn ghế đã bị mua
                setSelectedSeats(prev => 
                    prev.filter(seat => !data.soldSeatIds.includes(seat.id))
                );
                
            } catch (error) {
                console.error('❌ Lỗi polling:', error);
            }
        };

        pollSeatStatus();
        const pollingInterval = setInterval(pollSeatStatus, 2000);
        return () => clearInterval(pollingInterval);
    }, [showtime?.showtime_id, isShowtimePast]);

    // Tự động mở khóa ghế hết hạn
    useEffect(() => {
        if (!lockedSeatsWithExpiry || Object.keys(lockedSeatsWithExpiry).length === 0) return;

        const checkExpiredLocks = () => {
            const now = new Date();
            const expiredSeats = [];

            Object.entries(lockedSeatsWithExpiry).forEach(([seatId, expiresAt]) => {
                if (new Date(expiresAt) <= now) {
                    expiredSeats.push(parseInt(seatId));
                }
            });

            if (expiredSeats.length > 0) {
                setRealtimeLocked(prev => prev.filter(id => !expiredSeats.includes(id)));
            }
        };

        checkExpiredLocks();
        const interval = setInterval(checkExpiredLocks, 1000);
        return () => clearInterval(interval);
    }, [lockedSeatsWithExpiry]);

    // WebSocket
    useEffect(() => {
        if (!showtime?.showtime_id) return;

        const channelName = `showtime.${showtime.showtime_id}`;
        const channel = window.Echo?.channel(channelName);
        
        if (!channel) {
            console.warn('⚠️ WebSocket không khả dụng');
            return;
        }

        channel.listen('.seat.locked', (e) => {
            console.log("🔒 Ghế vừa bị khóa:", e);
            setRealtimeLocked(prev => [...new Set([...prev, e.seatId])]);
        });

        channel.listen('.seat.unlocked', (e) => {
            console.log("🔓 Ghế vừa được mở:", e);
            setRealtimeLocked(prev => prev.filter(id => id !== e.seatId));
        });

        return () => {
            window.Echo?.leave(channelName);
        };
    }, [showtime.showtime_id]);

    const updateCombo = (comboId, delta) => {
        setSelectedCombos(prev => {
            const currentQty = prev[comboId] || 0;
            const newQty = Math.max(0, currentQty + delta);
            const newState = { ...prev, [comboId]: newQty };
            if (newQty === 0) delete newState[comboId];
            return newState;
        });
    };

    const PRICE_STANDARD = 90000;
    const PRICE_VIP = 120000;
    const PRICE_COUPLE = 240000;

    const seatsByRow = useMemo(() => {
        if (!seats) return {};
        const groups = {};
        seats.forEach(seat => {
            const rowLabel = seat.seat_row; 
            if (!groups[rowLabel]) groups[rowLabel] = [];
            groups[rowLabel].push(seat);
        });
        return Object.keys(groups).sort().reduce((obj, key) => {
            obj[key] = groups[key].sort((a, b) => a.seat_number - b.seat_number);
            return obj;
        }, {});
    }, [seats]);

    const handleSeatClick = async (seat) => {
        const seatId = seat.seat_id || seat.id;
        const isSelected = selectedSeats.some(s => s.id === seatId);
        
        if (realtimeSold.includes(seatId)) {
            alert('Ghế này đã được đặt!');
            return;
        }
        
        if (realtimeLocked.includes(seatId) && !isSelected) {
            alert('Ghế này đang được người khác chọn!');
            return;
        }

        if (isSelected) {
            // BỎ CHỌN
            setSelectedSeats(prev => prev.filter(s => s.id !== seatId));
            try {
                await axios.post('/booking/unlock-seat', { 
                    showtime_id: showtime.showtime_id, 
                    seat_id: seatId 
                });
            } catch (error) {
                console.error("Lỗi mở khóa ghế:", error);
            }
        } else {
            // CHỌN MỚI
            if (selectedSeats.length >= 8) {
                alert("Bạn chỉ được chọn tối đa 8 ghế cho mỗi lần đặt.");
                return;
            }

            let price = PRICE_STANDARD;
            if (seat.seat_type === 'vip') price = PRICE_VIP;
            if (seat.seat_type === 'couple') price = PRICE_COUPLE;

            try {
                const res = await axios.post('/booking/lock-seat', { 
                    showtime_id: showtime.showtime_id, 
                    seat_id: seatId 
                });
                
                if (res.data.status === 'success') {
                    setSelectedSeats(prev => [...prev, {    
                        id: seatId, 
                        row: seat.seat_row, 
                        num: seat.seat_number,
                        type: seat.seat_type,
                        price: price 
                    }]);
                } else {
                    alert(res.data.message || "Ghế này vừa được người khác chọn.");
                    setRealtimeLocked(prev => [...prev, seatId]);
                }
            } catch (err) {
                console.error("Lỗi khóa ghế:", err);
                if (err.response?.status === 409) {
                    alert(err.response.data.message || "Ghế này không khả dụng!");
                    // Refresh trạng thái
                    const response = await axios.get(`/showtimes/${showtime.showtime_id}/seat-status`);
                    setRealtimeSold(response.data.soldSeatIds || []);
                    setRealtimeLocked(response.data.lockedSeatIds || []);
                } else {
                    alert("Có lỗi xảy ra. Vui lòng thử lại.");
                }
            }
        }
    };

    const handleContinue = () => {
        if (selectedSeats.length === 0) return;
        
        const seatIds = selectedSeats.map(s => s.id).join(',');
        const comboString = Object.entries(selectedCombos)
            .map(([id, qty]) => `${id}:${qty}`)
            .join(',');
        
        router.get('/payment', {
            showtime_id: showtime.showtime_id,
            seat_ids: seatIds,
            combos: comboString
        });
    };

    const seatsTotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
    const combosTotal = Object.entries(selectedCombos).reduce((sum, [id, qty]) => {
        const combo = combos.find(c => c.combo_id === parseInt(id));
        return sum + (combo ? parseFloat(combo.price) * qty : 0);
    }, 0);
    const totalPrice = seatsTotal + combosTotal;

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col h-screen overflow-hidden selection:bg-red-500 selection:text-white">
            <Head title={`Chọn ghế - ${movie.title}`} />

            {isShowtimePast && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
                    <div className="bg-gray-900 p-6 rounded-xl border border-red-500 max-w-md text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Suất chiếu sắp bắt đầu</h3>
                        <p className="text-gray-400">Đang chuyển về trang chọn suất...</p>
                    </div>
                </div>
            )}

            <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md shrink-0 h-16">
                <div className="flex items-center gap-4">
                    <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-800 rounded-full transition text-gray-400 hover:text-white">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg leading-tight uppercase tracking-wide text-white">{movie.title}</h1>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                            {cinema.name} • {room.name} • {showtime.start_time}
                        </p>
                    </div>
                </div>
                <Link href="/" className="p-2 hover:bg-gray-800 rounded-full transition text-gray-400 hover:text-white">
                    <X className="w-6 h-6" />
                </Link>
            </header>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <div className="flex-1 bg-gray-950 flex flex-col relative border-r border-gray-800">
                    <div className="w-full flex justify-center items-end mt-10 mb-14 relative perspective-500 shrink-0">
                        <div className="w-2/3 h-3 bg-white/10 rounded-[50%] shadow-[0_20px_60px_rgba(255,255,255,0.15)] transform rotate-x-45 border-t border-white/20"></div>
                        <span className="absolute -bottom-8 text-gray-600 text-[10px] uppercase tracking-[0.3em] font-bold flex items-center gap-2">
                            <Monitor className="w-3 h-3" /> Màn hình
                        </span>
                    </div>

                    <div className="flex-1 overflow-auto px-4 pb-32 md:pb-10 flex items-start justify-center custom-scrollbar">
                        <div className="scale-90 md:scale-100 origin-top pt-4">
                            {Object.entries(seatsByRow).map(([rowLabel, rowSeats]) => (
                                <div key={rowLabel} className="flex items-center justify-center gap-6 mb-3">
                                    <span className="w-4 text-gray-500 font-bold text-xs text-center">{rowLabel}</span>
                                    <div className="flex gap-2">
                                        {rowSeats.map(seat => {
                                            const seatId = seat.seat_id || seat.id;
                                            const isSold = realtimeSold.includes(seatId);
                                            const isLocked = realtimeLocked.includes(seatId);
                                            const isSelected = selectedSeats.some(s => s.id === seatId);
                                            
                                            let seatClass = "w-8 h-8 rounded bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 cursor-pointer"; 
                                            
                                            if (seat.seat_type === 'vip') 
                                                seatClass = "w-8 h-8 rounded bg-[#1a1c29] border border-yellow-600/60 text-yellow-600 hover:border-yellow-500 hover:text-yellow-400 hover:shadow-[0_0_10px_rgba(234,179,8,0.2)]";
                                            
                                            if (seat.seat_type === 'couple') 
                                                seatClass = "w-16 h-8 rounded-lg bg-[#1a1c29] border border-pink-500/60 text-pink-600 hover:border-pink-500 hover:text-pink-400";

                                            if (isSold) seatClass = "w-8 h-8 rounded bg-gray-800/40 border-transparent text-transparent cursor-not-allowed";
                                            if (isLocked) seatClass = "w-8 h-8 rounded bg-gray-700 opacity-50 cursor-not-allowed text-transparent border-gray-600";
                                            
                                            if (isSelected) 
                                                seatClass = `scale-110 z-10 bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/40 font-bold ${seat.seat_type === 'couple' ? 'w-16 h-8 rounded-lg' : 'w-8 h-8 rounded'}`;

                                            return (
                                                <button
                                                    key={seatId}
                                                    onClick={() => handleSeatClick(seat)}
                                                    disabled={isSold || (isLocked && !isSelected)}
                                                    className={`relative group transition-all duration-200 flex items-center justify-center text-[10px] ${seatClass}`}
                                                >
                                                    {isSold || isLocked ? 'X' : seat.seat_number}
                                                    
                                                    {!isSold && !isLocked && (
                                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap border border-gray-600 shadow-xl z-20 flex flex-col items-center">
                                                            <span className="font-bold">{rowLabel}{seat.seat_number}</span>
                                                            <span className="text-[10px] text-gray-400 uppercase">{seat.seat_type}</span>
                                                            <div className="text-red-400 font-bold mt-0.5">
                                                                {seat.seat_type === 'vip' ? '120k' : seat.seat_type === 'couple' ? '240k' : '90k'}
                                                            </div>
                                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 border-r border-b border-gray-600 rotate-45"></div>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <span className="w-4 text-gray-500 font-bold text-xs text-center">{rowLabel}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-900/50 backdrop-blur-sm p-4 flex flex-wrap justify-center gap-6 text-xs border-t border-gray-800 shrink-0 z-10">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-800 rounded border border-gray-700/50"></div> <span className="text-gray-400">Đã bán</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-600 rounded shadow-sm"></div> <span className="text-white font-bold">Đang chọn</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#1a1c29] border border-yellow-600 rounded"></div> <span className="text-yellow-600">VIP</span></div>
                        <div className="flex items-center gap-2"><div className="w-8 h-4 bg-[#1a1c29] border border-pink-500 rounded"></div> <span className="text-pink-500">Couple</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-800 border border-gray-600 rounded"></div> <span className="text-gray-400">Thường</span></div>
                    </div>
                </div>

                <div className="w-full md:w-96 bg-[#0b0c15] border-l border-gray-800 flex flex-col z-20 shadow-2xl relative">
                    <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="flex gap-4 mb-6">
                            <img src={movie.poster_url} className="w-24 h-36 object-cover rounded-lg shadow-lg border border-gray-700" alt="Poster" />
                            <div>
                                <h2 className="font-bold text-xl text-white mb-2 leading-tight">{movie.title}</h2>
                                <p className="text-sm text-gray-400 mb-2">2D Phụ đề</p>
                                <span className="bg-orange-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">T16</span>
                            </div>
                        </div>

                        <div className="space-y-4 border-t border-gray-800 pt-5 text-sm text-gray-300">
                            <div className="flex justify-between">
                                <span className="flex items-center gap-2 text-gray-500"><MapPin size={16}/> Rạp chiếu</span> 
                                <div className="text-right">
                                    <span className="font-bold text-white block">{cinema.name}</span>
                                    <span className="text-xs text-gray-500">{room.name}</span>
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <span className="flex items-center gap-2 text-gray-500"><Calendar size={16}/> Ngày chiếu</span> 
                                <span className="font-bold text-white">{showtime.start_time.substring(0, 10)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="flex items-center gap-2 text-gray-500"><Clock size={16}/> Suất chiếu</span> 
                                <div className="text-right">
                                    <span className="font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                        {showtime.start_time.substring(11, 16)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="my-6 border-t border-dashed border-gray-800"></div>

                        <div className="flex justify-between items-start">
                            <span className="text-gray-500 flex items-center gap-2"><Armchair size={16}/> Ghế chọn</span>
                            <div className="text-right max-w-[180px] flex flex-wrap justify-end gap-1.5">
                                {selectedSeats.length === 0 ? (
                                    <span className="text-gray-600 italic text-sm">Chưa chọn ghế</span>
                                ) : (
                                    selectedSeats.map(s => (
                                        <span key={s.id} className="text-white font-bold text-xs bg-red-600 px-2 py-1 rounded shadow-sm">
                                            {s.row}{s.num}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>

                        {combos && combos.length > 0 && (
                            <div className="mt-8 space-y-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Ưu đãi Combo</h3>
                                {combos.map(combo => {
                                    const qty = selectedCombos[combo.combo_id] || 0;
                                    return (
                                        <div key={combo.combo_id} className={`p-3 rounded-xl border transition flex items-center justify-between group
                                            ${qty > 0 ? 'bg-red-500/10 border-red-500/50' : 'bg-gray-800/30 border-gray-800 hover:border-gray-600'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-700 rounded-lg overflow-hidden shrink-0">
                                                    {combo.image_url ? (
                                                        <img src={combo.image_url} alt={combo.name} className="w-full h-full object-cover"/>
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xl">🍿</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={`font-bold text-sm ${qty > 0 ? 'text-white' : 'text-gray-300'}`}>{combo.name}</p>
                                                    <p className="text-[10px] text-gray-400 line-clamp-1">{combo.description}</p>
                                                    <p className="text-xs font-bold text-red-400 mt-0.5">{parseInt(combo.price).toLocaleString()} đ</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 bg-gray-900 rounded-lg p-1">
                                                {qty > 0 && (
                                                    <>
                                                        <button onClick={() => updateCombo(combo.combo_id, -1)} className="w-6 h-6 rounded hover:bg-gray-700 text-gray-400 flex items-center justify-center">-</button>
                                                        <span className="text-sm font-bold text-white min-w-[10px] text-center">{qty}</span>
                                                    </>
                                                )}
                                                <button 
                                                    onClick={() => updateCombo(combo.combo_id, 1)} 
                                                    className={`w-6 h-6 rounded flex items-center justify-center transition
                                                        ${qty > 0 ? 'bg-red-600 text-white shadow' : 'hover:bg-gray-700 text-gray-400'}`}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-[#0b0c15] border-t border-gray-800 shadow-[0_-5px_30px_rgba(0,0,0,0.8)] z-30">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-gray-400 text-sm mb-1 block">Tổng cộng</span>
                            <span className="text-2xl font-black text-white tracking-tight">{totalPrice.toLocaleString()} đ</span>
                        </div>
                        <button 
                            onClick={handleContinue}
                            disabled={selectedSeats.length === 0}
                            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300
                                ${selectedSeats.length > 0 
                                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-900/40 translate-y-0 cursor-pointer' 
                                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                }`}
                        >
                            Tiếp tục <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}