// ==================================================
// Sidebar — Green theme + mobile drawer + admin tools
// ==================================================

import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  HardHat,
  Bike,
  AlertTriangle,
  LogOut,
  User,
  X,
  FlaskConical,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/live', label: 'Live Monitor', icon: Activity },
  { to: '/helmets', label: 'Helmets', icon: HardHat },
  { to: '/bikes', label: 'Bikes', icon: Bike },
  { to: '/violations', label: 'Violations', icon: AlertTriangle },
  { to: '/simulator', label: 'Simulator', icon: FlaskConical, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
];

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Filter nav items by role — admin-only items hidden for non-admins
  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'ADMIN'
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-64 z-50
          bg-gradient-to-b from-[#16A34A] to-[#15803D]
          flex flex-col shadow-2xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between gap-3 px-5 border-b border-white/15">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-md">
              <HardHat className="w-5 h-5 text-[#16A34A]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Smart Helmet</p>
              <p className="text-[11px] text-white/70 leading-tight">Monitoring System</p>
            </div>
          </div>

          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-[#16A34A] shadow-md'
                    : 'text-white/90 hover:bg-white/15 hover:text-white hover:translate-x-0.5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 transition-transform duration-200 ${
                      isActive ? '' : 'group-hover:scale-110'
                    }`}
                  />
                  <span>{label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/15 p-3 space-y-2">
          <div className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg bg-white/10 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#16A34A] text-xs font-bold shrink-0 shadow-sm">
              {initials || <User className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">
                {user?.fullName || 'User'}
              </p>
              <p className="text-[11px] text-white/70 truncate tracking-wide">
                {user?.role || 'RIDER'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-red-500 hover:text-white transition-all duration-200 group"
          >
            <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}