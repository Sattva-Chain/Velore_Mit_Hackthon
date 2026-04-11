import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";

function MainDashBoardLayout() {
  return (
    // 1. Root container: Deep dark background, no white borders anywhere.
    <div className="flex h-screen w-full overflow-hidden bg-[#0A0F1A] text-slate-300 font-sans tracking-wide">
      
      {/* 2. Sidebar Component */}
      {/* Make sure your Sidebar component uses a background like bg-[#111827] 
          and if it has a border, use border-r border-[#1E293B] (a dark slate, NOT white) */}
      <Sidebar />
      
      {/* 3. Main Content Wrapper */}
      {/* bg-[#040914] gives the main area that ultra-dark look from the screenshots.
          min-w-0 prevents the layout from breaking when the terminal gets wide. */}
      <div className="flex flex-1 flex-col h-full min-w-0 relative overflow-hidden bg-[#040914]">
        
        {/* 4. The Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar w-full">
          
          {/* We let the Outlet take the full available width so the Scan terminal 
              and cards can match the wide layout in the images. */}
          <div className="w-full h-full flex flex-col">
            <Outlet />
          </div>
          
        </main>
        
      </div>
    </div>
  );
}

export default MainDashBoardLayout;