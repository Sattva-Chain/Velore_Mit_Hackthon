import React from "react";
import Sidebar from "../components/SideBar";
import { Outlet } from "react-router-dom";

const App: React.FC = () => {
  return (
    // The main container: full height, dark background, prevents full-page scrolling
    <div className="flex h-screen w-full overflow-hidden bg-[#0F172A] text-slate-200 font-sans">
      
      {/* 1. Sidebar Component */}
      <Sidebar />
      
      {/* 2. Main Content Area */}
      {/* flex-1 ensures it takes up all remaining space to the right of the sidebar. 
          overflow-y-auto allows ONLY this side to scroll up and down. */}
      <div className="flex-1 flex flex-col relative overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-700">
        
        <main className="flex-1 w-full h-full">
          {/* This is where Analysis2 or Scan gets rendered */}
          <Outlet />
        </main>
        
      </div>
    </div>
  );
};

export default App;