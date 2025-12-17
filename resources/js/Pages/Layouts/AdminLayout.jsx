import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
  LayoutDashboard, Film, Calendar, Users, Ticket, Clock, 
  Settings, LogOut, Search, Bell, Menu, X 
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
  const { url } = usePage(); // Lấy URL hiện tại để active menu
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex">
      {/* --- SIDEBAR --- */}
      <aside className={`w-64 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full z-30 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center px-6 border-b border-gray-800 justify-between">
           <div className="flex items-center">
               <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center mr-3 shadow-lg shadow-red-600/40">
                  <Film className="text-white" size={20} fill="currentColor" />
               </div>
               <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">CineTix</span>
           </div>
           <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400"><X size={24}/></button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4">
           <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Menu chính</p>
           
           <SidebarItem href="/admin/dashboard" icon={LayoutDashboard} label="Tổng Quan" active={url.startsWith('/admin/dashboard')} />
           <SidebarItem href="/admin/movies" icon={Film} label="Quản Lý Phim" active={url.startsWith('/admin/movies')} />
           
           {/* Link tới trang Xếp Lịch Mới */}
           <SidebarItem href="/admin/movie-schedule" icon={Calendar} label="Xếp Lịch Chiếu" active={url.startsWith('/admin/movie-schedule')} />
           <SidebarItem 
              href="/admin/showtimes" 
              icon={Clock} 
              label="Xếp Suất Chiếu" 
              active={url.startsWith('/admin/showtimes')} 
            />           
           <SidebarItem href="/admin/bookings" icon={Ticket} label="Đơn Đặt Vé" active={url.startsWith('/admin/bookings')} />
           <SidebarItem href="/admin/users" icon={Users} label="Khách Hàng" active={url.startsWith('/admin/users')} />
           
           <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2 mt-8">Hệ thống</p>
           <SidebarItem href="/admin/settings" icon={Settings} label="Cài Đặt" active={url.startsWith('/admin/settings')} />
        </div>

        <div className="p-4 border-t border-gray-800">
          <Link href="/logout" method="post" as="button" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-red-500 transition-colors">
            <LogOut size={20} />
            <span className="font-medium">Đăng Xuất</span>
          </Link>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* TOP NAV */}
        <header className="h-20 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-20 px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-white">
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

        {/* PAGE CONTENT */}
        <div className="p-8">
            {children}
        </div>
      </main>
    </div>
  );
}