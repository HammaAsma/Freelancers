// Dashboard.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Slidebar";
import Header from "../components/Header";
import FloatingTimer from "../components/FloatingTimer";
import { TimerProvider } from "../contexts/TimerContext";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <TimerProvider>
      <div className="min-h-screen bg-base-200 flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 md:ml-64">
          <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
          <main className="flex-1 overflow-auto">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <FloatingTimer />
    </TimerProvider>
  );
}
