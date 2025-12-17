import axios from 'axios';
import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, Film, Calendar, Users, Ticket, 
  Settings, LogOut, Search, Bell, Plus, MoreVertical, 
  TrendingUp, DollarSign, Clock, CheckCircle, XCircle,
  Edit, Trash2, ChevronDown, MapPin, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';

const CinemaAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // --- STATE DỮ LIỆU (Đã xóa data mẫu, khởi tạo rỗng) ---
  const [stats, setStats] = useState([]);
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [isScheduleLocked, setScheduleLocked] = useState(false); // Trạng thái khóa lịch
  const [isGenerating, setGenerating] = useState(false);

  // --- REFS & SCROLL SYNC ---
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);

  const handleScroll = (e) => {
    if (leftPanelRef.current) {
      leftPanelRef.current.scrollTop = e.target.scrollTop;
    }
  };

  // --- EFFECT: GỌI API LẤY DỮ LIỆU ---
  useEffect(() => {
    // TODO: Thay thế bằng call API thực tế của bạn
    const fetchData = async () => {
      try {
        // Ví dụ:
        // const statsData = await api.get('/admin/stats');
        // setStats(statsData);
        
        // const moviesData = await api.get('/admin/movies');
        // setMovies(moviesData);

        // const roomsData = await api.get('/admin/rooms');
        // setRooms(roomsData);

        // const schedulesData = await api.get('/admin/schedules');
        // setSchedules(schedulesData);
        
        console.log("Đang chờ dữ liệu từ API...");
      } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
      }
    };

    fetchData();
  }, []);

  // --- COMPONENTS CON ---
  const SidebarItem = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-1 ${
        activeTab === id 
        ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' 
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  const StatusBadge = ({ status }) => {
    const styles = {
      success: "bg-green-500/10 text-green-500 border-green-500/20",
      active: "bg-green-500/10 text-green-500 border-green-500/20",
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
      inactive: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    
    // Mapping trạng thái từ DB sang Text hiển thị
    const labels = {
      success: "Thành công",
      active: "Đang chiếu",
      pending: "Chờ thanh toán",
      cancelled: "Đã hủy",
      inactive: "Sắp chiếu",
    };

    return (
      <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${styles[status] || styles.inactive}`}>
        {labels[status] || status}
      </span>
    );
  };

  // Helper tính toán vị trí trên timeline (giả sử bắt đầu lúc 8h sáng)
  const timeToPixels = (hours) => (hours - 8) * 100; 
  
  const formatTime = (decimalTime) => {
    const hrs = Math.floor(decimalTime);
    const mins = Math.round((decimalTime - hrs) * 60);
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}`;
  };

    // --- HÀM GỌI API ---
    
    // 1. Hàm lấy dữ liệu lịch chiếu
    const fetchSchedules = async () => {
        try {
            const response = await axios.get('/admin/schedules', {
                params: { date: '2024-06-19' } // Gửi ngày đang chọn (Hardcode ví dụ, sau này thay bằng state ngày)
            });
            setSchedules(response.data.schedules); // Cập nhật State để vẽ lại bảng
        } catch (error) {
            console.error("Lỗi lấy lịch:", error);
        }
    };
    const handleAutoGenerate = async () => {
        if (isScheduleLocked) return;
        
        setGenerating(true);
        try {
            // 1. CHUẨN BỊ DỮ LIỆU
            // Lấy ngày hiện tại và format chuẩn YYYY-MM-DD (Ví dụ: 2024-06-19)
            // Lưu ý: Nếu bạn có State chọn ngày, hãy thay dòng này bằng state đó
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`; 

            console.log("Đang gửi ngày:", formattedDate); // Kiểm tra xem log ra đúng chưa

            // 2. GỌI API (METHOD POST)
            const response = await axios.post('/admin/schedules/auto-generate', {
                date: formattedDate // Gửi chính xác key 'date' khớp với validate backend
            });
            
            // 3. THÀNH CÔNG
            alert(response.data.message);
            fetchSchedules(); // Load lại bảng lịch

        } catch (error) {
            // 4. BẮT LỖI CHI TIẾT (QUAN TRỌNG)
            if (error.response) {
                console.error("Lỗi từ Server:", error.response.data);
                
                if (error.response.status === 422) {
                    // Lỗi Validation (Dữ liệu không hợp lệ)
                    const errors = error.response.data.errors;
                    // Lấy lỗi đầu tiên để hiển thị
                    const firstError = Object.values(errors)[0][0];
                    alert("⚠️ Lỗi dữ liệu: " + firstError); 
                } else {
                    // Lỗi 500 hoặc khác
                    alert("❌ Lỗi hệ thống: " + (error.response.data.message || "Không rõ nguyên nhân"));
                }
            } else {
                console.error("Lỗi mạng:", error);
            }
        } finally {
            setGenerating(false);
        }
    };

    const loadSchedules = async () => {
        try {
            const res = await axios.get("/admin/schedules");
            
            // CHUYỂN ĐỔI DỮ LIỆU ĐÚNG ĐỊNH DẠNG CHO GIAO DIỆN CỦA BẠN
            const formattedSchedules = res.data.schedules.map(s => ({
            id: s.id,
            roomId: s.room_id,
            movie: s.movie?.title || 'Phim chưa có tên',
            start: parseFloat(s.start_time),        // 9.0, 12.5, 15.0...
            duration: parseFloat(s.end_time) - parseFloat(s.start_time), // ví dụ: 2.5 giờ
            type: '2D'
            }));

            setSchedules(formattedSchedules);
            setRooms(res.data.rooms); // CẬP NHẬT LUÔN PHÒNG
        } catch (err) {
            console.error("Lỗi tải lịch:", err);
        }
    };
    useEffect(() => {
    loadSchedules();
    }, []);


  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #111827; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #374151 #111827; }
      `}</style>
      
      {/* --- SIDEBAR --- */}
      <aside className={`w-64 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full z-20 transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center px-6 border-b border-gray-800">
           <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center mr-3 shadow-lg shadow-red-600/40">
              <Film className="text-white" size={20} fill="currentColor" />
           </div>
           <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">CineTix Admin</span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
           <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Menu chính</p>
           <SidebarItem id="dashboard" icon={LayoutDashboard} label="Tổng Quan" />
           <SidebarItem id="movies" icon={Film} label="Quản Lý Phim" />
           <SidebarItem id="schedule" icon={Calendar} label="Lịch Chiếu" />
           <SidebarItem id="bookings" icon={Ticket} label="Đơn Đặt Vé" />
           <SidebarItem id="users" icon={Users} label="Khách Hàng" />
           
           <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2 mt-8">Hệ thống</p>
           <SidebarItem id="settings" icon={Settings} label="Cài Đặt" />
        </div>

        <div className="p-4 border-t border-gray-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-red-500 transition-colors">
            <LogOut size={20} />
            <span className="font-medium">Đăng Xuất</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        
        {/* TOP NAV */}
        <header className="h-20 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-10 px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="md:hidden text-gray-400 hover:text-white">
                    <MoreVertical size={24}/>
                </button>
                <div className="relative w-96 hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm..." 
                      className="w-full bg-gray-800 border border-gray-700 text-gray-300 px-4 py-2 pl-10 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <button className="relative text-gray-400 hover:text-white transition-colors">
                    <Bell size={22} />
                    {/* Badge thông báo (ẩn nếu không có) */}
                    {/* <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[10px] flex items-center justify-center font-bold text-white">3</span> */}
                </button>
                <div className="flex items-center gap-3 border-l border-gray-700 pl-6">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-white">Admin</p>
                        <p className="text-xs text-gray-500">Quản trị viên</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-gray-600">
                        {/* Avatar placeholder */}
                        <div className="w-full h-full flex items-center justify-center text-gray-400"><Users size={20}/></div>
                    </div>
                </div>
            </div>
        </header>

        {/* CONTENT BODY */}
        <div className="p-8">
            
            {/* VIEW: DASHBOARD */}
            {activeTab === 'dashboard' && (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   {stats.length > 0 ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                           {stats.map((stat, idx) => (
                               <div key={idx} className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
                                   {/* Render stats item here */}
                                   <h3 className="text-gray-400 text-sm font-medium mb-1">{stat.title}</h3>
                                   <p className="text-2xl font-bold text-white">{stat.value}</p>
                               </div>
                           ))}
                       </div>
                   ) : (
                       <div className="text-gray-500 text-center py-20">Chưa có dữ liệu thống kê.</div>
                   )}
               </div>
            )}

            {/* VIEW: MOVIES MANAGEMENT */}
            {activeTab === 'movies' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white">Danh sách phim</h2>
                        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
                            <Plus size={18} /> Thêm phim mới
                        </button>
                    </div>
                    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-medium">Tên Phim</th>
                                    <th className="p-4 font-medium">Thể Loại</th>
                                    <th className="p-4 font-medium">Thời Lượng</th>
                                    <th className="p-4 font-medium">Rating</th>
                                    <th className="p-4 font-medium">Trạng Thái</th>
                                    <th className="p-4 font-medium text-right">Hành Động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {movies.length > 0 ? movies.map((movie) => (
                                    <tr key={movie.id} className="hover:bg-gray-800/50 transition-colors group">
                                        <td className="p-4 font-bold text-white">{movie.title}</td>
                                        <td className="p-4 text-gray-400">{movie.genre}</td>
                                        <td className="p-4 text-gray-400 text-sm">{movie.duration}</td>
                                        <td className="p-4 text-yellow-500 font-bold">{movie.rating}</td>
                                        <td className="p-4"><StatusBadge status={movie.status} /></td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 hover:bg-gray-700 rounded text-blue-400"><Edit size={16} /></button>
                                                <button className="p-2 hover:bg-gray-700 rounded text-red-500"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-500">Chưa có dữ liệu phim.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* VIEW: SCHEDULE MANAGEMENT */}
            {activeTab === 'schedule' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-140px)] flex flex-col">
                    {/* Schedule Toolbar (Đã nâng cấp) */}
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-lg flex-shrink-0">
                        
                        {/* Khu vực 1: Chọn Rạp & Ngày */}
                        <div className="flex flex-wrap items-center gap-3">
                            <button className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg hover:border-red-500 transition-colors">
                                <MapPin size={16} className="text-red-500"/>
                                <span className="font-bold text-sm">CineTix Bà Triệu</span>
                                <ChevronDown size={14} className="text-gray-500"/>
                            </button>
                            
                            <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-1">
                                <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><ChevronLeft size={16}/></button>
                                <div className="px-4 flex items-center gap-2 cursor-pointer">
                                    <Calendar size={16} className="text-gray-400"/>
                                    <span className="text-sm font-bold text-white">19/06/2024</span>
                                </div>
                                <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><ChevronRight size={16}/></button>
                            </div>

                            {/* HIỂN THỊ TRẠNG THÁI LOCK */}
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${
                                isScheduleLocked 
                                ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                                : 'bg-green-500/10 border-green-500/30 text-green-500'
                            }`}>
                                {isScheduleLocked ? <XCircle size={14}/> : <CheckCircle size={14}/>}
                                {isScheduleLocked ? 'ĐÃ CHỐT SỔ' : 'ĐANG MỞ'}
                            </div>
                        </div>

                        {/* Khu vực 2: Các nút chức năng (Auto, Lock, Add) */}
                        <div className="flex items-center gap-3 ml-auto">
                            {/* Nút Tạo Tự Động */}
                            {/* Nút Tạo Tự Động - ĐÃ SỬA TÊN BIẾN */}
                            <button 
                                onClick={handleAutoGenerate} 
                                // SỬA: Đổi isLocked thành isScheduleLocked
                                disabled={isScheduleLocked || isGenerating} 
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border transition-all ${
                                    // SỬA: Đổi isLocked thành isScheduleLocked ở đây nữa
                                    (isScheduleLocked || isGenerating)
                                    ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-purple-600/10 border-purple-500/50 text-purple-400 hover:bg-purple-600 hover:text-white'
                                }`}
                            >
                                {isGenerating ? (
                                    <span className="animate-spin">⏳</span> 
                                ) : (
                                    <TrendingUp size={18} />
                                )}
                                {isGenerating ? 'Đang xếp lịch...' : 'Xếp tự động'}
                            </button>

                            {/* Nút Lock/Unlock Lịch */}
                            <button 
                                onClick={() => setScheduleLocked(!isScheduleLocked)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border transition-all ${
                                    isScheduleLocked 
                                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' // Nút mở khóa
                                    : 'bg-orange-600/10 border-orange-500/50 text-orange-500 hover:bg-orange-600 hover:text-white' // Nút khóa
                                }`}
                            >
                                {isScheduleLocked ? <Edit size={18}/> : <XCircle size={18}/>}
                                {isScheduleLocked ? 'Mở khóa lịch' : 'Chốt lịch'}
                            </button>

                            {/* Nút Thêm thủ công */}
                            <button 
                                disabled={isScheduleLocked}
                                className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors text-sm shadow-lg ${
                                    isScheduleLocked
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/20'
                                }`}
                            >
                                <Plus size={18} /> Thêm thủ công
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 shadow-xl flex flex-col overflow-hidden">
                        {rooms.length > 0 ? (
                            <div className="flex flex-1 overflow-hidden">
                                {/* LEFT PANEL */}
                                <div ref={leftPanelRef} className="w-40 flex-shrink-0 bg-gray-900 border-r border-gray-800 overflow-hidden">
                                    <div className="h-14 border-b border-gray-800 flex items-center px-4 font-bold text-gray-400 text-sm bg-gray-900">Phòng Chiếu</div>
                                    <div className="flex flex-col">
                                        {rooms.map((room, index ) => (
                                            <div key={room.room_id || room.id || index} className="flex border-b border-gray-800 h-28 group">
                                                <div className="w-48 p-4 border-r border-gray-800 sticky left-0 bg-gray-900 flex flex-col justify-center">
                                                <span className="font-bold text-white">{room.name}</span>
                                                <span className="text-xs text-gray-500 mt-1">120 ghế</span>
                                                </div>
                                                <div className="flex-1 relative">
                                                {schedules
                                                    .filter(s => s.room_id === room.room_id)
                                                    .map((sch) => (
                                                    <div
                                                        key={sch.id}
                                                        className="absolute top-3 bottom-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 border border-blue-400/50 shadow-lg p-3 hover:z-10 hover:scale-105 transition-all"
                                                        style={{
                                                        left: `${timeToPixels(sch.start)}px`,
                                                        width: `${sch.duration * 100}px`,
                                                        }}
                                                    >
                                                        <div className="font-bold text-xs truncate text-white">
                                                        {sch.movie?.title || 'Phim chưa có tên'}
                                                        </div>
                                                        <div className="text-[10px] text-blue-100 flex items-center gap-1 mt-1">
                                                        <Clock size={10} />
                                                        {sch.start.toFixed(2).replace('.', ':')} - {(sch.start + sch.duration).toFixed(2).replace('.', ':')}
                                                        </div>
                                                    </div>
                                                    ))}
                                                </div>
                                            </div>
                                            ))}
                                    </div>
                                </div>

                                {/* RIGHT PANEL */}
                                <div ref={rightPanelRef} 
                                    onScroll={handleScroll} 
                                    className="flex-1 overflow-auto bg-gray-900 relative custom-scrollbar">
                                    <div className="h-14 sticky top-0 z-20 bg-gray-900 border-b border-gray-800 flex min-w-max">
                                        {Array.from({ length: 17 }).map((_, i) => (
                                            <div key={i} className="w-[100px] p-4 border-r border-gray-800/30 text-xs text-gray-500 font-mono text-center flex-shrink-0">
                                                {i + 8}:00
                                            </div>
                                        ))}
                                    </div>
                                    <div className="min-w-max">
                                        {rooms.map((room, roomIdx) => (
                                            <div key={room.room_id || room.id || roomIdx} className="h-24 border-b border-gray-800 relative bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAwIDBMMTAwIDEwMCIgc3Ryb2tlPSIjMzczNzM3IiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvc3ZnPg==')] hover:bg-gray-800/20 transition-colors">
                                                {schedules
                                                    .filter(s => s.roomId === (room.room_id || room.id))
                                                    .map((schedule, schIdx) => (
                                                        <div 
                                                            key={schedule.id || schIdx}
                                                            className="absolute top-2 bottom-2 rounded-lg p-2 border shadow-lg cursor-pointer hover:brightness-110 hover:z-10 transition-all bg-blue-900/80 border-blue-500/50 text-blue-100 flex flex-col justify-center overflow-hidden"
                                                            style={{ 
                                                                left: `${timeToPixels(schedule.start)}px`, 
                                                                width: `${schedule.duration * 100}px` 
                                                            }}
                                                        >
                                                            <div className="font-bold text-xs truncate leading-tight">{schedule.movie}</div>
                                                            <div className="text-[10px] opacity-75 mt-1 flex items-center gap-1">
                                                                <Clock size={10}/>
                                                                {formatTime(schedule.start)} - {formatTime(schedule.start + schedule.duration)}
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <Calendar size={48} className="mb-4 opacity-50" />
                                <p>Chưa có dữ liệu phòng chiếu/lịch chiếu.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

             {/* Placeholder for other tabs */}
             {(activeTab === 'bookings' || activeTab === 'users' || activeTab === 'settings') && (
                 <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500 animate-in fade-in zoom-in duration-300">
                     <Settings size={48} className="mb-4 opacity-50" />
                     <h3 className="text-xl font-bold text-gray-400 mb-2">Đang phát triển</h3>
                     <p>Tính năng {activeTab} sẽ được tích hợp với API sau.</p>
                 </div>
             )}

        </div>
      </main>
    </div>
  );
};

export default CinemaAdminDashboard;