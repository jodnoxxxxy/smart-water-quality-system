import React from 'react';
import { Home, User, MapPin, MessageSquare, Star, Settings, Menu, Droplets, GlassWater, ArrowLeftRight, Microscope } from 'lucide-react';
import { UserAccount } from '../types';

export type NavTab = 'home_guide' | 'dashboard' | 'analyze' | 'locations' | 'history' | 'standards' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentUser?: UserAccount | null;
  onOpenAuth?: () => void;
  appMode?: 'resident' | 'technician';
  onToggleAppMode?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  currentUser,
  onOpenAuth,
  appMode = 'resident',
  onToggleAppMode,
}) => {
  // Navigation items separated based on App Mode (Rule 2 & 14)
  const residentNavItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home_guide', label: 'Check Water', icon: <GlassWater className="w-5 h-5" /> },
    { id: 'history', label: 'My Saved Tests', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'standards', label: 'Safety Limits', icon: <Star className="w-5 h-5" /> },
    { id: 'settings', label: 'Home Profile', icon: <User className="w-5 h-5" /> },
  ];

  const technicianNavItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Water Footpath', icon: <Home className="w-5 h-5" /> },
    { id: 'analyze', label: 'Lab Simulator', icon: <Droplets className="w-5 h-5" /> },
    { id: 'locations', label: 'Regional Sources', icon: <MapPin className="w-5 h-5" /> },
    { id: 'history', label: 'Audit Records', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'standards', label: 'WHO Matrix', icon: <Star className="w-5 h-5" /> },
    { id: 'settings', label: 'System & Roles', icon: <Settings className="w-5 h-5" /> },
  ];

  const navItems = appMode === 'resident' ? residentNavItems : technicianNavItems;

  return (
    <aside
      className={`bg-[#181b2a] text-slate-300 transition-all duration-300 ease-in-out flex flex-col items-center py-4 select-none shrink-0 z-30 shadow-xl ${
        collapsed ? 'w-16' : 'w-20 md:w-60'
      }`}
    >
      {/* Top Hamburger & Brand */}
      <div className="w-full flex items-center justify-between px-4 mb-5">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Toggle Navigation"
        >
          <Menu className="w-6 h-6" />
        </button>
        {!collapsed && (
          <div className="hidden md:flex flex-col pr-2">
            <span className="font-black text-sm tracking-wide text-white uppercase flex items-center gap-1.5">
              <span>💧</span>
              <span>{appMode === 'resident' ? 'AquaHome' : 'AquaLab'}</span>
            </span>
            <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">
              {appMode === 'resident' ? 'Local Edition' : 'Field Station'}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="w-full flex flex-col space-y-2 flex-1 relative">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <div key={item.id} className="relative w-full">
              {isActive && (
                <>
                  <div className="absolute right-0 -top-3 w-3 h-3 pointer-events-none hidden md:block">
                    <svg viewBox="0 0 12 12" className="w-full h-full fill-[#edf2f7]">
                      <path d="M12,0 C12,6.627 6.627,12 0,12 L12,12 Z" />
                    </svg>
                  </div>
                  <div className="absolute right-0 -bottom-3 w-3 h-3 pointer-events-none hidden md:block">
                    <svg viewBox="0 0 12 12" className="w-full h-full fill-[#edf2f7]">
                      <path d="M0,0 C6.627,0 12,5.373 12,12 L12,0 Z" />
                    </svg>
                  </div>
                </>
              )}

              <button
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-5 py-2.5 transition-all relative text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#edf2f7] text-[#181b2a] font-bold rounded-l-2xl shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 rounded-xl mx-2 w-[calc(100%-16px)]'
                }`}
                title={item.label}
              >
                <div
                  className={`flex items-center justify-center transition-transform ${
                    isActive ? 'scale-110 text-[#0ea5e9]' : ''
                  }`}
                >
                  {item.icon}
                </div>
                {!collapsed && (
                  <span className="hidden md:inline-block text-xs font-semibold tracking-wide truncate">
                    {item.label}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Mode Separator & Switcher (Rule: Keep software for local people, make technician mode separate) */}
      {onToggleAppMode && !collapsed && (
        <div className="px-3 w-full mb-3 hidden md:block">
          <button
            onClick={onToggleAppMode}
            className="w-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-300 border border-slate-700/60 p-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            title={appMode === 'resident' ? 'Switch to Field Lab Mode' : 'Switch to Home Resident Mode'}
          >
            {appMode === 'resident' ? (
              <>
                <Microscope className="w-3.5 h-3.5 text-cyan-400" />
                <span>Lab Tech Mode</span>
              </>
            ) : (
              <>
                <span>🏡</span>
                <span>Resident Mode</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Bottom Profile Indicator */}
      <div className="pt-3 border-t border-slate-800/80 w-full px-3 flex flex-col items-center">
        <button
          onClick={onOpenAuth || (() => onSelectTab('settings'))}
          className="flex items-center gap-3 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 w-full transition-colors cursor-pointer"
          title={currentUser ? `Signed in as ${currentUser.name} (${currentUser.roleTitle})` : 'Sign In'}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0ea5e9] to-[#38bdf8] flex items-center justify-center text-white text-xs font-bold ring-2 ring-[#0ea5e9]/30 shrink-0">
            {currentUser ? (
              currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          {!collapsed && (
            <div className="hidden md:flex flex-col text-left overflow-hidden">
              <span className="text-xs font-bold text-white truncate">
                {currentUser ? currentUser.name : 'Sign In'}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {currentUser ? currentUser.roleTitle : 'Guest User'}
              </span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
