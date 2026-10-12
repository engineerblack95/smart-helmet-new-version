// ==================================================
// Topbar — Header with mobile menu toggle
// ==================================================

import { Bell, User, Menu } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useSocket } from '../../contexts/SocketContext.jsx';

export default function Topbar({ title, subtitle }) {
  const { user } = useAuth();
  const { connected } = useSocket();
  const { openSidebar } = useOutletContext() || {};

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-brand-gray-border shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile hamburger */}
          {openSidebar && (
            <button
              onClick={openSidebar}
              className="lg:hidden p-2 -ml-2 rounded-lg text-brand-black hover:bg-brand-gray-light transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-brand-black leading-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-brand-gray leading-tight mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-green-light">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-brand-green animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span className="text-xs font-medium text-brand-green-dark">
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>

          <button className="p-2 rounded-lg hover:bg-brand-gray-light text-brand-gray hover:text-brand-black transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-brand-gray-border">
            <div className="w-8 h-8 rounded-full bg-brand-green-light flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-brand-green-dark" />
            </div>
            <span className="hidden md:block text-sm text-brand-black truncate max-w-[180px]">
              {user?.email}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}