import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : undefined;
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  return (
    <div className="flex flex-col h-screen print:h-auto m-0 p-0 overflow-hidden print:overflow-visible bg-gray-100 print:bg-white">
      {/* Topbar spans the full width at the top */}
      <Topbar
        currentUser={user}
        onLogout={handleLogout}
        onToggleMobileNav={() => setIsMobileNavOpen((v) => !v)}
        isMobileNavOpen={isMobileNavOpen}
      />

      {/* Container for Sidebar and Main Content */}
      <div className="flex flex-1 overflow-hidden print:overflow-visible">
        <Sidebar isMobileOpen={isMobileNavOpen} onCloseMobileNav={() => setIsMobileNavOpen(false)} currentUser={user} />
        <main className="flex-1 overflow-y-auto print:overflow-visible p-4 sm:p-8 print:p-0 bg-[#f8f9fa] print:bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
