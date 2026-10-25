import React from 'react';
import { 
  Activity, 
  GitMerge 
} from 'lucide-react';
import type { CivicCase } from '../../types/case';

interface TelemetryInspectorProps {
  civicCase: CivicCase;
  allCases: CivicCase[];
}

export const TelemetryInspector: React.FC<TelemetryInspectorProps> = ({
  civicCase,
  allCases,
}) => {
  // Aggregate stats across all cases
  const totalBarriers = allCases.filter(c => c.category === 'Accessibility').length;
  const criticalCount = allCases.filter(c => c.severity === 'Critical').length;
  const verifiedCount = allCases.filter(c => c.verification?.verificationStatus === 'VISUALLY_VERIFIED').length;
  const verificationRate = allCases.length > 0 ? Math.round((verifiedCount / allCases.length) * 100) : 0;

  return (
    <aside className="w-full lg:w-72 xl:w-80 bg-[#090D16] border-l border-slate-800 p-4 space-y-5 overflow-y-auto h-full text-xs font-mono select-none">
      {/* Telemetry Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
        <span className="flex items-center gap-1.5 text-sky-400">
          <Activity className="w-4 h-4" />
          Telemetry Inspector
        </span>
        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
          LIVE
        </span>
      </div>

      {/* Priority Score Gauge Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span>Priority Index</span>
          <span className="text-amber-400 font-bold">{civicCase.priorityScore} / 100</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-500 ${
              civicCase.priorityScore > 85
                ? 'bg-rose-500'
                : civicCase.priorityScore > 70
                ? 'bg-amber-500'
                : 'bg-sky-500'
            }`}
            style={{ width: `${civicCase.priorityScore}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
          <span>SLA Target:</span>
          <span className="text-slate-300 font-semibold">{civicCase.estimatedResponseTarget?.split(' ')[0] || '24h'}</span>
        </div>
      </div>

      {/* Corroboration & Clustering Metrics */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">
          Evidence Corroboration
        </span>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
            <div className="text-lg font-bold text-sky-400">{civicCase.evidence.length}</div>
            <div className="text-[10px] text-slate-400">Photos Logged</div>
          </div>
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
            <div className="text-lg font-bold text-purple-400">{civicCase.mergeHistory.length}</div>
            <div className="text-[10px] text-slate-400">Merged Reports</div>
          </div>
        </div>

        {civicCase.mergeHistory.length > 0 && (
          <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <GitMerge className="w-3 h-3 text-purple-400" />
              Latest Match Score:
            </span>
            <strong className="text-purple-300">
              {civicCase.mergeHistory[civicCase.mergeHistory.length - 1].duplicateScore}%
            </strong>
          </div>
        )}
      </div>

      {/* AI Inference Audit Metadata */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">
          AI Inference Audit
        </span>

        <div className="space-y-1.5 text-[11px] text-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Model:</span>
            <span className="text-sky-400 font-bold truncate max-w-[140px]">
              {civicCase.aiAnalysis?.modelUsed || 'gemma-4-27b-it'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Mode:</span>
            <span className="text-amber-400">
              {civicCase.aiAnalysis?.isSimulated ? 'Simulated' : 'Live REST API'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Confidence:</span>
            <span className="text-emerald-400 font-bold">
              {((civicCase.aiAnalysis?.confidenceScore || 0.9) * 100).toFixed(0)}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Analyzed:</span>
            <span className="text-slate-400">
              {civicCase.aiAnalysis?.analyzedAt
                ? new Date(civicCase.aiAnalysis.analyzedAt).toLocaleTimeString()
                : 'Initial'}
            </span>
          </div>
        </div>
      </div>

      {/* Campus Wide Operations Overview */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">
          Campus Network Status
        </span>

        <div className="space-y-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Active ADA Barriers:</span>
            <span className="text-amber-400 font-bold">{totalBarriers}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Critical Hazards:</span>
            <span className="text-rose-400 font-bold">{criticalCount}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Visual Verification Rate:</span>
            <span className="text-emerald-400 font-bold">{verificationRate}%</span>
          </div>
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-500 leading-relaxed">
        Visual verification represents photographic comparison only. Official structural clearance requires on-site certified engineering inspection.
      </div>
    </aside>
  );
};
