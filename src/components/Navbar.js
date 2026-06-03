import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/', icon: '⚡', label: 'Dashboard' },
  { path: '/appliances', icon: '🔌', label: 'Appliances' },
  { path: '/bill', icon: '🧾', label: 'Bill' },
  { path: '/predict', icon: '📈', label: 'Predict' },
  { path: '/tariff', icon: '🌍', label: 'Tariff' },
  { path: '/reminders', icon: '🔔', label: 'Reminders' },
  { path: '/history', icon: '📊', label: 'History' },
  { path: '/ai', icon: '🤖', label: 'AI Chat' },
];

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <>
      <div className="sticky top-0 z-50 bg-black border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm font-bold">
            A
          </div>
          <span className="text-lg font-bold tracking-tight">AmperAI</span>
          <span className="ml-auto text-xs text-white/40 hidden sm:block">Smart Energy Manager</span>
          {/* User info + Logout */}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-white/40">
              👋 {user?.name || 'User'}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs bg-white/5 border border-white/10 text-white/50 hover:text-red-400 hover:border-red-400/30 px-3 py-1.5 rounded-xl transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur border-t border-white/10 py-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-3 max-w-2xl mx-auto sm:justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all flex-shrink-0 ${
                  isActive ? 'text-blue-400' : 'text-white/40 hover:text-white/70'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default Navbar;