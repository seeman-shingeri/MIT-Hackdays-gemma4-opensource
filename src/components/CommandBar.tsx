import React from 'react';
import { 
  Wrench, 
  Play, 
  PlusCircle, 
  Settings, 
  Award, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface CommandBarProps {
  onOpenReportModal: () => void;
  onOpenModelModal: () => void;
  onOpenRubricModal: () => void;
  onStartReplay: () => void;
  onResetDemo: () => void;
  isReplayActive: boolean;
  selectedModel: string;
  isDemoMode: boolean;
  hasApiKey: boolean;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  onOpenReportModal,
  onOpenModelModal,
  onOpenRubricModal,
  onStartReplay,
  onResetDemo,
  isReplayActive,
  selectedModel,
  isDemoMode,
  hasApiKey,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#090D16]/95 border-b border-slate-800 backdrop-blur-md px-4 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-sky-500/20">
            <Wrench className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-black tracking-tight text-slate-100">
                REPAIR<span className="text-sky-400">.AI</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                GEMMA 4
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 leading-tight">
              Civic Infrastructure Intelligence
            </p>
          </div>
        </div>

        {/* Center: AI Connection Status Pill (Clickable) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenModelModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-xs font-mono transition-all group"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isDemoMode
                  ? 'bg-amber-400 animate-pulse'
                  : hasApiKey
                  ? 'bg-emerald-400'
                  : 'bg-rose-400'
              }`}
            />
            <span className="text-slate-300 group-hover:text-slate-100">
              {isDemoMode ? (
                <>
                  <span className="text-amber-400 font-bold">DEMO SIMULATOR</span>
                  <span className="text-slate-500 mx-1">•</span>
                  <span className="text-slate-400">{selectedModel}</span>
                </>
              ) : (
                <>
                  <span className="text-emerald-400 font-bold">LIVE API</span>
                  <span className="text-slate-500 mx-1">•</span>
                  <span className="text-slate-300">{selectedModel}</span>
                </>
              )}
            </span>
            <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 ml-0.5" />
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Prominent Community Problem Replay Button */}
          <button
            type="button"
            onClick={onStartReplay}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shadow-md ${
              isReplayActive
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/20 ring-2 ring-amber-400/50'
                : 'bg-gradient-to-r from-amber-500/20 to-sky-500/20 hover:from-amber-500/30 hover:to-sky-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-400 shadow-amber-500/10'
            }`}
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isReplayActive ? 'animate-pulse' : ''}`} />
            <span>Community Replay</span>
            <Sparkles className="w-3 h-3 text-amber-400" />
          </button>

          {/* New Incident Report Button */}
          <button
            type="button"
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-mono font-bold transition-all shadow-md shadow-sky-500/20"
          >
            <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">New Report</span>
          </button>

          {/* Judge Rubric Modal Button */}
          <button
            type="button"
            onClick={onOpenRubricModal}
            title="Open Judge Rubric & Architecture"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono transition-colors flex items-center gap-1.5"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Rubric</span>
          </button>

          {/* Reset Demo State Button */}
          <button
            type="button"
            onClick={onResetDemo}
            title="Reset to default demonstration state"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
