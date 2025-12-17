import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { 
  User, Ticket, LogOut, Clock, MapPin, QrCode, Star, CreditCard, 
  Camera, ShieldCheck, ChevronRight, Mail, Phone, Calendar, Lock,
  Award, Zap, Crown, CheckCircle2, XCircle
} from 'lucide-react';
import axios from 'axios';

// --- CẤU HÌNH GIAO DIỆN HẠNG THÀNH VIÊN ---
const RANK_THEMES = {
  'Bronze': {
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/50',
    gradient: 'from-orange-900 via-black to-gray-900',
    icon: ShieldCheck,
    label: 'Thành Viên Mới'
  },
  'Silver': {
    color: 'text-gray-300',
    bg: 'bg-gray-400/10',
    border: 'border-gray-400/50',
    gradient: 'from-gray-800 via-slate-900 to-black',
    icon: Star,
    label: 'Thân Thiết'
  },
  'Gold': {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/50',
    gradient: 'from-yellow-900 via-amber-950 to-black',
    icon: Award,
    label: 'V.I.P'
  },
  'Platinum': {
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/50',
    gradient: 'from-cyan-900 via-blue-950 to-black',
    icon: Zap,
    label: 'Super V.I.P'
  },
  'Diamond': {
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/50',
    gradient: 'from-purple-900 via-fuchsia-950 to-black',
    icon: Crown,
    label: 'Legendary'
  }
};

const Toast = ({ message, type, onClose }) => {
    if (!message) return null;
    return (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border animate-in slide-in-from-right duration-300 ${
            type === 'success' ? 'bg-green-900/80 border-green-500/30 text-green-100' : 'bg-red-900/80 border-red-500/30 text-red-100'
        }`}>
            {type === 'success' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
            <div>
                <h4 className="font-bold text-sm">{type === 'success' ? 'Thành công' : 'Lỗi'}</h4>
                <p className="text-xs opacity-90">{message}</p>
            </div>
            <button onClick={onClose} className="ml-4 hover:opacity-70"><XCircle size={16}/></button>
        </div>
    );
};

export default function Account({ user, membership, stats, upcomingTickets, historyTickets }) {
  const [activeTab, setActiveTab] = useState('tickets');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [toast, setToast] = useState(null); 

  useEffect(() => {
    if (toast) {
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [toast]);

  const profileForm = useForm({
    full_name: user.full_name || '',
    phone: user.phone || '',
    date_of_birth: user.date_of_birth || '',
  });

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    profileForm.post('/account/update-profile', {
        preserveScroll: true,
        onSuccess: () => setToast({ type: 'success', message: 'Cập nhật thông tin thành công!' }),
        onError: () => setToast({ type: 'error', message: 'Vui lòng kiểm tra lại thông tin.' })
    });
  };

  const passwordForm = useForm({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  const handleChangePassword = (e) => {
    e.preventDefault();
    passwordForm.post('/account/change-password', {
        preserveScroll: true,
        onSuccess: () => {
            setToast({ type: 'success', message: 'Đổi mật khẩu thành công!' });
            passwordForm.reset();
        },
        onError: (errors) => setToast({ type: 'error', message: errors.current_password || 'Mật khẩu không khớp.' })
    });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      await axios.post('/account/upload-avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      router.reload();
      setToast({ type: 'success', message: 'Ảnh đại diện đã được cập nhật.' });
    } catch (error) {
      setToast({ type: 'error', message: 'Lỗi upload ảnh.' });
    }
  };

  const handleViewTicket = async (bookingId) => {
    try {
      const response = await axios.get(`/account/tickets/${bookingId}`);
      // Với TicketResource, dữ liệu chi tiết vé cũng nằm trong .data
      setSelectedTicket(response.data.data); 
    } catch (error) {
        setToast({ type: 'error', message: 'Không thể tải vé.' });
    }
  };

  const currentTheme = RANK_THEMES[membership.current_rank] || RANK_THEMES['Bronze'];
  const RankIcon = currentTheme.icon;

  const TabButton = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${
        activeTab === id 
        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-900/30 translate-x-1' 
        : 'text-gray-400 hover:bg-gray-800/50 hover:text-white hover:translate-x-1'
      }`}
    >
      <Icon size={18} className={activeTab === id ? 'animate-pulse' : ''} /> 
      {label}
      {activeTab === id && <ChevronRight size={16} className="ml-auto opacity-70" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-gray-100 font-sans selection:bg-red-500 selection:text-white pb-12">
      <Head title="Tài khoản của tôi" />
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      
      <div className="relative h-60 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gray-900">
            <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-b ${currentTheme.gradient} opacity-50`}></div>
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 relative z-10 -mt-20">
        <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center md:items-end gap-6 mb-8 relative overflow-hidden group/card">
            <div className="relative">
                <div className={`w-32 h-32 rounded-full p-1 bg-gradient-to-br ${currentTheme.gradient} shadow-2xl relative z-10`}>
                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full border-4 border-gray-900" />
                </div>
                <label className="absolute bottom-1 right-1 z-20 bg-gray-900 text-white p-2 rounded-full border border-gray-700 hover:bg-red-600 transition-colors shadow-lg cursor-pointer">
                    <Camera size={16} />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
            </div>
            
            <div className="text-center md:text-left flex-1 pb-2">
                <h1 className="text-3xl font-bold text-white mb-2">{user.full_name}</h1>
                <div className="flex items-center justify-center md:justify-start gap-3 text-sm text-gray-400 mb-4">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${currentTheme.bg} ${currentTheme.border} border ${currentTheme.color} font-bold uppercase text-xs tracking-wider`}>
                        <RankIcon size={14} /> {currentTheme.label} ({membership.current_rank})
                    </span>
                    <span>{user.email}</span>
                </div>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
                 <div className="flex-1 md:flex-none bg-gray-800/50 p-4 rounded-xl border border-white/5 text-center min-w-[120px]">
                     <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Điểm tích lũy</p>
                     <p className={`text-2xl font-bold ${currentTheme.color}`}>{stats.points.toLocaleString()}</p>
                 </div>
                 <div className="flex-1 md:flex-none bg-gray-800/50 p-4 rounded-xl border border-white/5 text-center min-w-[120px]">
                     <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Vouchers</p>
                     <p className="text-2xl font-bold text-white">{stats.vouchers}</p>
                 </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-2">
                <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-2 border border-white/5 sticky top-4">
                    <TabButton id="tickets" icon={Ticket} label="Vé của tôi" />
                    <TabButton id="membership" icon={CreditCard} label="Hạng thành viên" />
                    <TabButton id="info" icon={User} label="Thông tin cá nhân" />
                    <TabButton id="security" icon={Lock} label="Bảo mật" />
                    <div className="my-2 border-t border-gray-800/50 mx-2"></div>
                    <button onClick={() => { if(confirm('Đăng xuất?')) router.post('/logout') }} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-medium">
                        <LogOut size={18} /> Đăng xuất
                    </button>
                </div>
            </div>

            <div className="lg:col-span-3">
                <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 md:p-8 min-h-[600px]">
                    
                    {/* TAB: TICKETS */}
                    {activeTab === 'tickets' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Ticket className="text-red-500" /> Vé Sắp Chiếu
                            </h2>
                            
                            {/* --- ĐÃ SỬA: upcomingTickets.data --- */}
                            {upcomingTickets.data && upcomingTickets.data.length > 0 ? upcomingTickets.data.map(ticket => (
                                <div key={ticket.booking_id} className="relative group bg-[#16161a] rounded-2xl border border-gray-800 overflow-hidden flex flex-col sm:flex-row hover:border-red-500/50 transition-all duration-300 shadow-xl">
                                    <div className="w-full sm:w-40 h-48 sm:h-auto relative overflow-hidden">
                                        <img src={ticket.movie.poster_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Poster"/>
                                        <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg z-10 uppercase">
                                            {ticket.status}
                                        </div>
                                    </div>

                                    <div className="flex-1 p-5 flex flex-col justify-between relative">
                                        <div>
                                            <h3 className="font-bold text-lg text-white mb-1 group-hover:text-red-500 transition-colors line-clamp-1">{ticket.movie.title}</h3>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-400 mt-3">
                                                <p className="flex items-center gap-2"><Clock size={14} className="text-red-500"/> {ticket.showtime}</p>
                                                <p className="flex items-center gap-2"><MapPin size={14} className="text-gray-500"/> {ticket.cinema} - {ticket.room}</p>
                                            </div>
                                            <div className="mt-3 text-sm">
                                                 Ghế: <span className="text-white font-mono font-bold">{ticket.seats}</span>
                                            </div>
                                        </div>

                                        <div className="mt-5 pt-4 border-t border-dashed border-gray-800 flex justify-between items-center">
                                            <div className="text-xs text-gray-500 flex flex-col">
                                                <span>Mã đặt vé</span>
                                                <span className="text-white font-mono text-lg">{ticket.booking_code}</span>
                                            </div>
                                            <button onClick={() => handleViewTicket(ticket.booking_id)} className="flex items-center gap-2 text-xs font-bold bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition-colors uppercase tracking-wider">
                                                <QrCode size={14} /> Xem vé
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-dashed border-gray-700">
                                    <Ticket size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-gray-500">Bạn chưa có vé nào sắp chiếu</p>
                                </div>
                            )}

                            <h2 className="text-xl font-bold text-white mt-8 mb-4">Lịch Sử</h2>
                            <div className="space-y-3">
                                {/* --- ĐÃ SỬA: historyTickets.data --- */}
                                {historyTickets.data && historyTickets.data.map(ticket => (
                                    <div key={ticket.booking_id} className="bg-[#121215] p-3 rounded-lg border border-gray-800/50 flex items-center justify-between hover:bg-gray-800 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-14 bg-gray-800 rounded overflow-hidden">
                                                <img src={ticket.movie.poster_url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt="poster" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-300 group-hover:text-white">{ticket.movie.title}</h4>
                                                <p className="text-[11px] text-gray-500">{ticket.showtime} • {ticket.cinema}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-green-500 font-bold px-2 py-1 bg-green-900/10 rounded border border-green-900/20">Hoàn thành</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB: MEMBERSHIP */}
                    {activeTab === 'membership' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className={`relative overflow-hidden rounded-2xl border ${currentTheme.border} bg-[#111] p-8 text-center mb-8`}>
                                <div className={`absolute inset-0 bg-gradient-to-b ${currentTheme.gradient} opacity-20`}></div>
                                
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${currentTheme.border} ${currentTheme.bg} mb-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>
                                        <RankIcon size={48} className={currentTheme.color} />
                                    </div>
                                    <h3 className={`text-2xl font-black uppercase tracking-widest ${currentTheme.color} mb-1`}>{membership.current_rank}</h3>
                                    <p className="text-gray-400 text-sm">Hạng thành viên hiện tại</p>

                                    {membership.next_rank && (
                                        <div className="w-full max-w-md mt-8">
                                            <div className="flex justify-between text-xs mb-2 font-bold uppercase tracking-wide">
                                                <span className={currentTheme.color}>{stats.points} Points</span>
                                                <span className="text-gray-500">Mục tiêu: {membership.next_rank_points}</span>
                                            </div>
                                            <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-700">
                                                <div 
                                                    className={`h-full rounded-full bg-gradient-to-r ${currentTheme.gradient} relative overflow-hidden`} 
                                                    style={{ width: `${(stats.points / membership.next_rank_points) * 100}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                                </div>
                                            </div>
                                            <p className="text-center text-xs text-gray-400 mt-4">
                                                Còn thiếu <span className="text-white font-bold">{(membership.next_rank_points - stats.points).toLocaleString()}</span> điểm để lên hạng {membership.next_rank}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: INFO */}
                    {activeTab === 'info' && (
                        <form onSubmit={handleUpdateProfile} className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-xl mx-auto pt-4">
                            <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                                <User size={20} className="text-red-500"/> Chỉnh sửa hồ sơ
                            </h2>
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Họ và tên</label>
                                        <input 
                                            type="text" 
                                            value={profileForm.data.full_name}
                                            onChange={e => profileForm.setData('full_name', e.target.value)}
                                            className="w-full bg-[#16161a] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-none text-sm"
                                        />
                                        {profileForm.errors.full_name && <p className="text-red-500 text-xs mt-1">{profileForm.errors.full_name}</p>}
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Số điện thoại</label>
                                        <input 
                                            type="text" 
                                            value={profileForm.data.phone}
                                            onChange={e => profileForm.setData('phone', e.target.value)}
                                            className="w-full bg-[#16161a] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-none text-sm"
                                        />
                                        {profileForm.errors.phone && <p className="text-red-500 text-xs mt-1">{profileForm.errors.phone}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Ngày sinh</label>
                                    <input 
                                        type="date" 
                                        value={profileForm.data.date_of_birth}
                                        onChange={e => profileForm.setData('date_of_birth', e.target.value)}
                                        className="w-full bg-[#16161a] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-none text-sm"
                                    />
                                    {profileForm.errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{profileForm.errors.date_of_birth}</p>}
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Email (Không thể đổi)</label>
                                    <div className="relative">
                                        <input 
                                            type="email" 
                                            value={user.email} 
                                            disabled 
                                            className="w-full bg-[#0b0b0f] border border-gray-800 rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed outline-none text-sm"
                                        />
                                        <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"/>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-gray-800">
                                    <button 
                                        type="submit" 
                                        disabled={profileForm.processing}
                                        className="px-6 py-2.5 rounded-lg text-sm font-bold bg-white text-black hover:bg-gray-200 transition-all disabled:opacity-50"
                                    >
                                        {profileForm.processing ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* TAB: SECURITY */}
                    {activeTab === 'security' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-xl mx-auto pt-4">
                            <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                                <ShieldCheck size={20} className="text-red-500"/> Đổi mật khẩu
                            </h2>
                            
                            <form onSubmit={handleChangePassword} className="space-y-5">
                                <div>
                                    <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Mật khẩu hiện tại</label>
                                    <input 
                                        type="password"
                                        value={passwordForm.data.current_password}
                                        onChange={e => passwordForm.setData('current_password', e.target.value)}
                                        className="w-full bg-[#16161a] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:border-red-500 transition-all outline-none text-sm"
                                    />
                                    {passwordForm.errors.current_password && <p className="text-red-500 text-xs mt-1">{passwordForm.errors.current_password}</p>}
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Mật khẩu mới</label>
                                    <input 
                                        type="password"
                                        value={passwordForm.data.new_password}
                                        onChange={e => passwordForm.setData('new_password', e.target.value)}
                                        className="w-full bg-[#16161a] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:border-red-500 transition-all outline-none text-sm"
                                    />
                                    {passwordForm.errors.new_password && <p className="text-red-500 text-xs mt-1">{passwordForm.errors.new_password}</p>}
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Xác nhận mật khẩu</label>
                                    <input 
                                        type="password"
                                        value={passwordForm.data.new_password_confirmation}
                                        onChange={e => passwordForm.setData('new_password_confirmation', e.target.value)}
                                        className="w-full bg-[#16161a] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:border-red-500 transition-all outline-none text-sm"
                                    />
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-gray-800">
                                    <button 
                                        type="submit" 
                                        disabled={passwordForm.processing}
                                        className="px-6 py-2.5 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50"
                                    >
                                        {passwordForm.processing ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* QR CODE MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}>
            <div className="bg-[#1a1a1e] rounded-2xl p-6 max-w-sm w-full border border-gray-700 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="text-center mb-6">
                    {/* Các thuộc tính trong selectedTicket cũng nằm trong .data nếu bạn gọi API qua resource, nhưng vì ở trên mình dùng axios.get, mình đã xử lý selectedTicket(response.data.data) ở hàm handleViewTicket rồi, nên ở đây dùng trực tiếp */}
                    <h3 className="text-lg font-bold text-white">{selectedTicket.movie.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{selectedTicket.cinema} - {selectedTicket.room}</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl mb-6 shadow-inner">
                    <img src={selectedTicket.qr_code || 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Example'} alt="QR Code" className="w-full mix-blend-multiply" />
                </div>
                
                <div className="space-y-3">
                    <div className="flex justify-between text-sm border-b border-gray-800 pb-2">
                        <span className="text-gray-500">Mã vé</span>
                        <span className="text-white font-mono font-bold tracking-wider">{selectedTicket.booking_code}</span>
                    </div>
                    <div className="flex justify-between text-sm border-b border-gray-800 pb-2">
                        <span className="text-gray-500">Giờ chiếu</span>
                        <span className="text-white font-bold">{selectedTicket.showtime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Ghế</span>
                        <span className="text-white font-bold">{selectedTicket.seats}</span>
                    </div>
                </div>

                <button onClick={() => setSelectedTicket(null)} className="w-full mt-6 py-3 bg-white text-black hover:bg-gray-200 rounded-xl font-bold transition-colors">
                    Đóng
                </button>
            </div>
        </div>
      )}
    </div>
  );
}