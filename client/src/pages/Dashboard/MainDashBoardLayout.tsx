import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";

function MainDashBoardLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950 text-zinc-300 antialiased">
      <Sidebar />

      <div className="flex flex-1 flex-col h-full min-w-0 relative overflow-hidden bg-zinc-950 border-l border-zinc-800/80">
        <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar max-w-[1600px] mx-auto w-full">
          
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