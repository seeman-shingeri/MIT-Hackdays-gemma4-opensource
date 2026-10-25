import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  Camera
} from 'lucide-react';
import type { CivicCase } from '../../types/case';

interface CaseFeedProps {
  cases: CivicCase[];
  selectedCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  onStartInspection: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  currentUserId?: string;
  initialFilter?: 'All' | 'Active' | 'Resolved' | 'My Reports';
}

export const CaseFeed: React.FC<CaseFeedProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  onStartInspection,
  isDemoMode,
  onToggleDemoMode,
  currentUserId,
  initialFilter = 'All',
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Resolved' | 'My Reports'>(initialFilter);

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      // My reports filter
      if (statusFilter === 'My Reports') {
        if (!currentUserId || c.createdBy !== currentUserId) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === 'Active' && (c.status === 'RESOLVED' || c.status === 'CLOSED' || c.verification?.verificationStatus === 'VISUALLY_VERIFIED')) {
        return false;
      }
      if (statusFilter === 'Resolved' && c.status !== 'RESOLVED' && c.verification?.verificationStatus !== 'VISUALLY_VERIFIED') {
        return false;
      }

      // Search query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesId = c.id.toLowerCase().includes(query);
        const matchesTitle = c.title.toLowerCase().includes(query);
        const matchesZone = c.zone.toLowerCase().includes(query);
        const matchesLandmark = c.landmark.toLowerCase().includes(query);
        const matchesCategory = c.category.toLowerCase().includes(query);
        const matchesReporter = c.createdByName?.toLowerCase().includes(query) || false;
        return matchesId || matchesTitle || matchesZone || matchesLandmark || matchesCategory || matchesReporter;
      }

      return true;
    });
  }, [cases, statusFilter, searchTerm, currentUserId]);

  // Clean, iOS-style status badge
  const renderStatusBadge = (c: CivicCase) => {
    if (c.verification?.verificationStatus === 'VISUALLY_VERIFIED' || c.status === 'RESOLVED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Resolved
        </span>
      );
    }

    switch (c.status) {
      case 'WORK_ORDER_ISSUED':
      case 'REPAIR_IN_PROGRESS':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Assigned
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Under Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Reported
          </span>
        );
    }
  };

  // GENUINE EMPTY STATE: When no reports have been submitted yet
  if (cases.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full text-center p-8 sm:p-10 rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 stroke-[2]" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              No Reports Yet
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              No civic infrastructure issues have been recorded in your local database. Start an inspection to detect and report an issue.
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={onStartInspection}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Start an Inspection</span>
            </button>

            <button
              type="button"
              onClick={onToggleDemoMode}
              className="w-full min-h-[40px] flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Load Demonstration Dataset</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white/70 backdrop-blur-xl border-r border-slate-200/70">
      {/* Demo Data Banner when active */}
      {isDemoMode && (
        <div className="bg-amber-50/90 border-b border-amber-200 px-4 py-2 text-xs flex items-center justify-between text-amber-900">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>DEMO DATA ({cases.length} Sample Reports)</span>
          </div>
          <button
            type="button"
            onClick={onToggleDemoMode}
            className="text-[11px] font-semibold text-amber-800 hover:underline"
          >
            Exit Demo
          </button>
        </div>
      )}

      {/* Top Search & Filter Bar */}
      <div className="p-3.5 border-b border-slate-200/60 space-y-2.5 bg-white/50 backdrop-blur-md">
        {/* Single Compact Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search reports by title, zone, category..."
            className="w-full bg-slate-100/80 border border-slate-200/80 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Compact Segmented Status Filter */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center p-0.5 bg-slate-100/90 rounded-lg border border-slate-200/70 overflow-x-auto scrollbar-none">
            {(
              (currentUserId
                ? ['All', 'Active', 'Resolved', 'My Reports']
                : ['All', 'Active', 'Resolved']) as Array<'All' | 'Active' | 'Resolved' | 'My Reports'>
            ).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all ${
                  statusFilter === s
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {filteredCases.length} {filteredCases.length === 1 ? 'incident' : 'incidents'}
          </span>
        </div>
      </div>

      {/* Incident Cards List */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2 overscroll-y-contain">
        {filteredCases.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <p className="text-xs font-medium text-slate-700">No matching reports found</p>
            <p className="text-[11px] text-slate-400">Try adjusting your search terms or filter.</p>
          </div>
        ) : (
          filteredCases.map(c => {
            const isSelected = selectedCaseId === c.id;
            const primaryPhoto = c.evidence[0]?.imageUrl;

            return (
              <div
                key={c.id}
                onClick={() => onSelectCase(c.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-500/20'
                    : 'border-slate-200/70 bg-white/80 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {primaryPhoto && (
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0">
                      <img
                        src={primaryPhoto}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {c.category}
                      </span>
                      {renderStatusBadge(c)}
                    </div>

                    <h3 className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
                      {c.title}
                    </h3>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{c.zone} {c.landmark ? `— ${c.landmark}` : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
