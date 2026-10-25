import React from 'react';
import { 
  ShieldCheck, 
  Play, 
  Plus, 
  Settings, 
  HelpCircle, 
  ClipboardList
} from 'lucide-react';

interface CommandBarProps {
  onOpenReportModal: () => void;
  onOpenModelModal: () => void;
  onOpenRubricModal: () => void;
  onStartReplay: () => void;
  isReplayActive: boolean;
  totalReportsCount: number;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  onOpenReportModal,
  onOpenModelModal,
  onOpenRubricModal,
  onStartReplay,
  isReplayActive,
  totalReportsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Descriptor */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-base tracking-tight">
                REPAIR<span className="text-blue-600">.AI</span>
              </span>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                Civic Field Inspector
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Community Infrastructure &amp; Accessibility Resolution
            </p>
          </div>
        </div>

        {/* Center / Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-900 bg-slate-100 border border-slate-200"
          >
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <span>Reports</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-xs font-semibold bg-blue-600 text-white">
              {totalReportsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={onStartReplay}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isReplayActive
                ? 'bg-amber-50 text-amber-900 border border-amber-300 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Play className={`w-4 h-4 ${isReplayActive ? 'text-amber-600 fill-amber-600' : 'text-slate-500'}`} />
            <span>Community Replay</span>
          </button>

          <button
            type="button"
            onClick={onOpenRubricModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Project Rubric</span>
          </button>
        </nav>

        {/* Right Primary Actions */}
        <div className="flex items-center gap-2.5">
          {/* Settings Trigger (API Key & Engine) */}
          <button
            type="button"
            onClick={onOpenModelModal}
            title="Configure AI Engine & API"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Prominent New Report Action Button */}
          <button
            type="button"
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
