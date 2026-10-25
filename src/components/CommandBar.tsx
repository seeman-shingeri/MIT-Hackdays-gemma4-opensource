import React from 'react';
import { 
  ShieldCheck, 
  Camera, 
  Settings, 
  Info, 
  ClipboardList,
  Sparkles
} from 'lucide-react';

export type AppTab = 'reports' | 'inspect' | 'about';

interface CommandBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenSettings: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  reportsCount: number;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
  isDemoMode,
  onToggleDemoMode,
  reportsCount,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full h-16 backdrop-blur-xl bg-white/80 border-b border-slate-200/70 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        {/* Brand & iOS-style Logo */}
        <button
          type="button"
          onClick={() => onSelectTab('reports')}
          className="flex items-center gap-2.5 text-left focus:outline-none group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
            <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-base tracking-tight block leading-none">
              REPAIR<span className="text-blue-600">.AI</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              Civic Fault Recognition
            </span>
          </div>
        </button>

        {/* Center: Desktop Segmented Control (Apple-style 3 Destinations) */}
        <nav className="hidden md:flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 shadow-inner">
          <button
            type="button"
            onClick={() => onSelectTab('reports')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
            onClick={() => onSelectTab('inspect')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
            onClick={() => onSelectTab('about')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'about'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About</span>
          </button>
        </nav>

        {/* Right Actions: Demo Mode Toggle & Settings */}
        <div className="flex items-center gap-2">
          {/* Explicitly Labeled Demo Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDemoMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isDemoMode
                ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title={isDemoMode ? 'Demo Mode Active — Click to exit' : 'Click to preview demo data'}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isDemoMode ? 'text-amber-600' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">
              {isDemoMode ? 'Demo Mode' : 'Try Demo'}
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
