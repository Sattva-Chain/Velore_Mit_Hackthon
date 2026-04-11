import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  UserCircle, 
  Settings, 
  ShieldAlert, 
  LogOut,
  ChevronRight
} from "lucide-react"; 

interface ITages {
  name: string;
  Routes: string;
  icon: React.ReactNode;
}

const Sidebar: React.FC = () => {
  // Using useLocation is the professional way to handle active states in React Router
  const location = useLocation();
  const navigate = useNavigate();

  const SideBarData: ITages[] = [
    { name: "Dashboard", Routes: "/Dashboard", icon: <LayoutDashboard size={18} /> },
    { name: "Threat Analysis", Routes: "/Dashboard/Analysis", icon: <ShieldAlert size={18} /> },
    { name: "Profile", Routes: "/Dashboard/Profile", icon: <UserCircle size={18} /> },
    { name: "Settings", Routes: "/Dashboard/Setting", icon: <Settings size={18} /> },
  ];

  return (
    <>
      {/* --- Sidebar --- */}
      <aside className="w-64 h-screen fixed top-0 left-0 bg-[#0f172a] border-r border-slate-800 flex flex-col z-50 transition-all duration-300">
        
        {/* App Logo / Header */}
        <div 
          className="h-20 flex items-center px-6 border-b border-slate-800 cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all">
            <span className="text-white font-black text-lg leading-none">S</span>
          </div>
          <div className="ml-3">
            <h1 className="text-sm font-bold text-white tracking-wide">SECURE<span className="text-cyan-400">SCAN</span></h1>
            <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest">Enterprise Edition</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-6 px-4 scrollbar-thin scrollbar-thumb-slate-800">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Main Menu</p>
          <nav className="flex flex-col gap-1">
            {SideBarData.map((item, idx) => {
              // Check if the current path matches the route
              const isActive = location.pathname === item.Routes;

              return (
                <Link
                  key={idx}
                  to={item.Routes}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    isActive 
                      ? "bg-cyan-500/10 text-cyan-400 shadow-[inset_2px_0_0_0_rgba(6,182,212,1)]" 
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`${isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"} transition-colors`}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-semibold">{item.name}</span>
                  </div>
                  
                  {/* Subtle chevron for active items to indicate location */}
                  {isActive && <ChevronRight size={14} className="text-cyan-500/50" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer / Bottom Actions */}
        <div className="p-4 border-t border-slate-800 bg-[#020617]/30">
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                <UserCircle size={18} className="text-slate-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-200">Admin User</span>
                <span className="text-[10px] text-slate-500">System Engineer</span>
              </div>
            </div>
            <button className="text-slate-500 hover:text-rose-400 transition-colors" title="Log out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* --- Main Content Layout Wrapper --- */}
      {/* This div ensures that your main content doesn't get hidden behind the fixed sidebar. 
        It applies the exact same background color to blend perfectly.
      */}
      <div className="pl-64 min-h-screen bg-[#020617]">
        {/* Your Page Routes/Content will render here automatically via React Router */}
      </div>
    </>
  );
};

export default Sidebar;