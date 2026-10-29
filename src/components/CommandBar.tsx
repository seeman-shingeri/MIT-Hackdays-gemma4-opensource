import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  Camera, 
  Settings, 
  Info, 
  ClipboardList,
  Sparkles,
  Trophy,
  LogIn,
  User,
  LogOut,
  FileText
} from 'lucide-react';
import type { UserAccount } from '../types/auth';

export type AppTab = 'reports' | 'inspect' | 'leaderboard' | 'about';

interface CommandBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenSettings: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  reportsCount: number;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  onOpenProfile: (userId: string) => void;
  onFilterMyReports: () => void;
  onLogout: () => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
  isDemoMode,
  onToggleDemoMode,
  reportsCount,
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onFilterMyReports,
  onLogout,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full h-16 backdrop-blur-xl bg-white/80 border-b border-slate-200/70 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        {/* Brand & iOS/macOS Logo */}
        <button
          type="button"
          onClick={() => onSelectTab('reports')}
          className="flex items-center gap-2.5 text-left focus:outline-none group shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
            <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-base tracking-tight block leading-none">
              REPAIR<span className="text-blue-600">.AI</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              Civic Intelligence
            </span>
          </div>
        </button>

        {/* Center: Desktop Segmented Control (macOS Glass Style) */}
        <nav 
          role="tablist"
          aria-label="Main application navigation"
          className="hidden md:flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 shadow-inner"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'reports'}
            aria-label="Incident Reports (Shortcut: 1)"
            title="Reports (Shortcut: 1)"
            onClick={() => onSelectTab('reports')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'reports'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Reports</span>
            {reportsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'reports' ? 'bg-slate-100 text-slate-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {reportsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'inspect'}
            aria-label="Inspect Fault (Shortcut: 2)"
            title="Inspect (Shortcut: 2)"
            onClick={() => onSelectTab('inspect')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'inspect'
                ? 'bg-white text-blue-600 shadow-xs ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Inspect</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'leaderboard'}
            aria-label="Contributor Leaderboard (Shortcut: 3)"
            title="Leaderboard (Shortcut: 3)"
            onClick={() => onSelectTab('leaderboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-white text-amber-700 shadow-xs ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Leaderboard</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'about'}
            aria-label="About & System Architecture (Shortcut: 4)"
            title="About (Shortcut: 4)"
            onClick={() => onSelectTab('about')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'about'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About</span>
          </button>
        </nav>

        {/* Right Actions: User Account, Demo Mode & Settings */}
        <div className="flex items-center gap-2">
          {/* User Account / Sign In State */}
          {currentUser ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-white/90 hover:bg-slate-50 border border-slate-200/80 shadow-xs transition-colors"
                title="Account menu"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                  {currentUser.displayName.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-slate-800 max-w-[90px] truncate hidden sm:inline">
                  {currentUser.displayName}
                </span>
                <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                  currentUser.role === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : currentUser.role === 'maintenance'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {currentUser.role}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in duration-100">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900 block truncate">
                      {currentUser.displayName}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {currentUser.email}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenProfile(currentUser.id);
                    }}
                    className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>My Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onFilterMyReports();
                    }}
                    className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>My Reports</span>
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Explicitly Labeled Demo Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDemoMode}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              isDemoMode
                ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title={isDemoMode ? 'Demo Mode Active — Click to exit' : 'Click to preview demo data'}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isDemoMode ? 'text-amber-600' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">
              {isDemoMode ? 'Demo' : 'Try Demo'}
            </span>
          </button>

          {/* Engine Settings Sheet Trigger */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="Configure AI API Key & Engine"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors focus:ring-2 focus:ring-blue-500"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
