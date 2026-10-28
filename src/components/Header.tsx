import React, { useState } from 'react';
import { Search, Bell, MoreHorizontal, CheckCircle2, AlertTriangle, X, Droplet, Plus, Sparkles } from 'lucide-react';
import { AlertNotification, RegionType, UserAccount } from '../types';
import { User as UserIcon, LogIn, LogOut } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedRegion: RegionType;
  onRegionChange: (r: RegionType) => void;
  notifications: AlertNotification[];
  onDismissNotification: (id: string) => void;
  onOpenTestModal: () => void;
  currentUser?: UserAccount | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedRegion,
  onRegionChange,
  notifications,
  onDismissNotification,
  onOpenTestModal,
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="bg-[#1eaedb] text-white px-6 py-3.5 shadow-md flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Search Input Bar (rounded pill with magnifying glass icon matching reference image) */}
      <div className="flex-1 max-w-2xl relative">
        <div className="relative flex items-center w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search water parameters, sample records, TDS, pH, or minerals..."
            aria-label="Search water parameters"
            className="w-full bg-white text-slate-800 placeholder-slate-400 pl-5 pr-12 py-2.5 rounded-full text-sm font-medium shadow-inner outline-none transition-all focus:ring-2 focus:ring-white/80"
          />
          <div className="absolute right-4 text-[#1eaedb] pointer-events-none">
            <Search className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Right Icons and Controls */}
      <div className="flex items-center gap-3">
        {/* Real Cloud Database Status Badge */}
        <div className="hidden md:flex items-center gap-1.5 bg-emerald-500/25 text-emerald-100 border border-emerald-300/40 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          <span>Cloud DB Live</span>
        </div>

        {/* Real AI Engine Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 bg-purple-500/25 text-purple-100 border border-purple-300/40 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-2xs">
          <Sparkles className="w-3 h-3 text-purple-200" />
          <span>Gemini AI Live</span>
        </div>

        {/* Quick New Sample Button */}
        <button
          onClick={onOpenTestModal}
          className="hidden sm:flex items-center gap-2 bg-white/20 hover:bg-white text-white hover:text-[#1eaedb] font-semibold text-xs px-3.5 py-2 rounded-full backdrop-blur-sm transition-all border border-white/30 cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Test</span>
        </button>

        {/* Region Selector Badge */}
        <div className="hidden lg:flex items-center bg-black/15 text-white/95 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm">
          <Droplet className="w-3.5 h-3.5 mr-1.5 text-cyan-200" />
          <select
            value={selectedRegion}
            onChange={(e) => onRegionChange(e.target.value as RegionType)}
            className="bg-transparent text-white font-medium outline-none cursor-pointer text-xs"
          >
            <option value="groundwater" className="text-slate-800">Groundwater</option>
            <option value="urban" className="text-slate-800">Urban Tap</option>
            <option value="industrial" className="text-slate-800">Industrial Area</option>
            <option value="coastal" className="text-slate-800">Coastal Zone</option>
          </select>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-full hover:bg-white/15 transition-colors cursor-pointer text-white"
            title="Notifications & Alerts"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-300 rounded-full ring-2 ring-[#1eaedb]" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 text-slate-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-800">Quality Alerts & Logs</span>
                <span className="text-[11px] font-semibold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">
                  {notifications.length} updates
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No active alerts</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 relative">
                      <div className="mt-0.5">
                        {n.type === 'alert' || n.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-xs font-bold text-slate-800">{n.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                      </div>
                      <button
                        onClick={() => onDismissNotification(n.id)}
                        className="text-slate-300 hover:text-slate-500 absolute top-3 right-3"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile / Auth Button */}
        {currentUser ? (
          <div
            onClick={onOpenAuth}
            className="w-8 h-8 rounded-full bg-white/25 hover:bg-white/35 border-2 border-white flex items-center justify-center font-bold text-xs text-white shadow-sm select-none cursor-pointer transition"
            title={`Active: ${currentUser.name} (${currentUser.roleTitle}) - Click to Switch User`}
          >
            {currentUser.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 bg-white text-[#1eaedb] hover:bg-cyan-50 font-bold text-xs px-3 py-1.5 rounded-full transition shadow-sm cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}

        {/* 3-dots Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-full hover:bg-white/15 transition-colors cursor-pointer text-white"
            title="Options & Tools"
            aria-label="Options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 text-slate-800 py-2 z-50 text-xs font-medium">
              {currentUser && (
                <div className="px-4 py-2 border-b border-slate-100">
                  <span className="font-bold text-slate-800 block truncate">{currentUser.name}</span>
                  <span className="text-[10px] text-cyan-600 font-semibold uppercase tracking-wider block">
                    {currentUser.roleTitle}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate mt-0.5">{currentUser.facility}</span>
                </div>
              )}

              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenTestModal();
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-slate-700"
              >
                <Plus className="w-3.5 h-3.5 text-[#1eaedb]" />
                <span>Run Instant Analysis</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenAuth();
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-slate-700"
              >
                <UserIcon className="w-3.5 h-3.5 text-[#1eaedb]" />
                <span>{currentUser ? 'Switch / Manage Personnel' : 'Sign In / Register'}</span>
              </button>

              {currentUser && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-rose-50 flex items-center gap-2 cursor-pointer text-rose-600"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              )}

              <div className="border-t border-slate-100 my-1" />
              <div className="px-4 py-1.5 text-[11px] text-slate-400">
                AquaSmart · WHO 4th Edition Compliant
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
