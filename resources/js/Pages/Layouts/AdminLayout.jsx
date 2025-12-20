import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
  LayoutDashboard, Film, Calendar, Users, Ticket, Clock, 
  Settings, LogOut, Menu, X 
} from 'lucide-react';

const SidebarItem = ({ href, icon: Icon, label, active }) => (
  <Link 
    href={href}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-1 ${
      active 
      ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' 
      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

export default function AdminLayout({ children, title = "Admin Dashboard" }) {
  const { url } = usePage(); 
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // ✅ Kiểm tra xem trang hiện tại có cần Full màn hình không (để bỏ padding)
  // Ví dụ: Trang xếp lịch cần full màn hình để hiển thị bảng timeline
  const isFullScreenPage = url.startsWith('/admin/showtimes') || url.startsWith('/admin/movie-schedule');

  return (
    // 1️⃣ ROOT: Khóa chiều cao bằng màn hình (h-screen), cấm body cuộn (overflow-hidden)
    <div className="h-screen w-screen bg-gray-950 text-gray-100 font-sans flex overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside className={`w-64 bg-gray-900 border-r border-gray-800 flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="h-20 flex items-center px-6 border-b border-gray-800 justify-between shrink-0">
           <div className="flex items-center">
               <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center mr-3 shadow-lg shadow-red-600/40">
                  <Film className="text-white" size={20} fill="currentColor" />
               </div>
               <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">CineTix</span>
           </div>
           <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400"><X size={24}/></button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
           <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Menu chính</p>
           <SidebarItem href="/admin/dashboard" icon={LayoutDashboard} label="Tổng Quan" active={url.startsWith('/admin/dashboard')} />
           <SidebarItem href="/admin/movie-schedule" icon={Calendar} label="Xếp Lịch Chiếu" active={url.startsWith('/admin/movie-schedule')} />
           <SidebarItem href="/admin/showtimes" icon={Clock} label="Xếp Suất Chiếu" active={url.startsWith('/admin/showtimes')} />           
        </div>

        <div className="p-4 border-t border-gray-800 shrink-0">
          <Link href="/logout" method="post" as="button" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-red-500 transition-colors">
            <LogOut size={20} />
            <span className="font-medium">Đăng Xuất</span>
          </Link>
        </div>
      </aside>

      {/* --- MAIN CONTENT WRAPPER --- */}
      {/* Flex-1 để chiếm hết phần còn lại, Flex-col để chia Header và Body */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        
        {/* TOP NAV - Cố định height */}
        <header className="h-20 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 shrink-0 px-8 flex items-center justify-between z-40">
            <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="md:hidden text-gray-400 hover:text-white">
                    <Menu size={24}/>
                </button>
                <h1 className="text-xl font-bold text-white hidden md:block">{title}</h1>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 border-l border-gray-700 pl-6">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-white">Admin</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                        <Users size={20} className="text-gray-400"/>
                    </div>
                </div>
            </div>
        </header>

        {/* 2️⃣ PAGE CONTENT AREA
            - flex-1: Chiếm hết chiều cao còn lại sau khi trừ Header.
            - overflow-hidden: Cắt bỏ scroll của Layout cha (để con tự scroll).
            - relative: Để định vị các thành phần con.
        */}
        <main className="flex-1 overflow-hidden relative bg-[#0b0b0f]">
            {/* Nếu là trang FullScreen (như Timeline) thì KHÔNG thêm padding, ngược lại thêm p-8 */}
            <div className={`h-full w-full ${isFullScreenPage ? '' : 'p-8 overflow-y-auto'}`}>
                {children}
            </div>
        </main>
      </div>
    </div>
  );
}