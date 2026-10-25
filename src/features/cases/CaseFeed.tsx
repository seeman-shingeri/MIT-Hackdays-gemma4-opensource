import React, { useState, useMemo } from 'react';
import { 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  MapPin, 
  GitMerge, 
  Image as ImageIcon 
} from 'lucide-react';
import type { CivicCase, IssueCategory, CaseStatus } from '../../types/case';

interface CaseFeedProps {
  cases: CivicCase[];
  selectedCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  onOpenReportModal: () => void;
}

const CATEGORIES: Array<'All' | IssueCategory> = [
  'All',
  'Accessibility',
  'Electrical',
  'Plumbing',
  'Structural',
  'Pedestrian Safety',
];

export const CaseFeed: React.FC<CaseFeedProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  onOpenReportModal,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | IssueCategory>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Verified'>('All');

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      // Category filter
      if (selectedCategory !== 'All' && c.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter === 'Active' && (c.status === 'RESOLVED' || c.status === 'CLOSED')) {
        return false;
      }
      if (statusFilter === 'Verified' && c.verification?.verificationStatus !== 'VISUALLY_VERIFIED') {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesId = c.id.toLowerCase().includes(query);
        const matchesTitle = c.title.toLowerCase().includes(query);
        const matchesZone = c.zone.toLowerCase().includes(query);
        const matchesLandmark = c.landmark.toLowerCase().includes(query);
        const matchesDesc = c.evidence.some(e => e.description.toLowerCase().includes(query));
        return matchesId || matchesTitle || matchesZone || matchesLandmark || matchesDesc;
      }

      return true;
    });
  }, [cases, selectedCategory, statusFilter, searchTerm]);

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'High':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Medium':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      default:
        return 'bg-slate-700/30 text-slate-400 border-slate-600/30';
    }
  };

  const getStatusBadge = (status: CaseStatus, hasVerification: boolean) => {
    if (hasVerification) {
      return (
        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 rounded">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          VERIFIED
        </span>
      );
    }

    switch (status) {
      case 'WORK_ORDER_ISSUED':
        return (
          <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950/40 border border-sky-500/30 px-1.5 py-0.5 rounded">
            WORK ORDER
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded">
            UNDER REVIEW
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded">
            REPORTED
          </span>
        );
    }
  };

  return (
    <aside className="w-full lg:w-80 xl:w-96 flex flex-col bg-[#090D16] border-r border-slate-800 h-full select-none">
      {/* Top Search & Filter Bar */}
      <div className="p-3.5 border-b border-slate-800 space-y-2.5 bg-slate-900/30">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by ID, keyword, zone..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 font-mono"
          />
        </div>

        {/* Category Pill Filters (Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Quick Status Segmented Controls */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
          <div className="flex gap-1">
            {(['All', 'Active', 'Verified'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  statusFilter === s
                    ? 'text-sky-400 font-bold bg-slate-800'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-500">
            {filteredCases.length} {filteredCases.length === 1 ? 'case' : 'cases'}
          </span>
        </div>
      </div>

      {/* Case List Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
        {filteredCases.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs font-mono">No matching civic cases found</p>
            <button
              type="button"
              onClick={onOpenReportModal}
              className="text-xs font-mono text-sky-400 hover:underline"
            >
              + Create New Incident Report
            </button>
          </div>
        ) : (
          filteredCases.map(c => {
            const isSelected = selectedCaseId === c.id;
            const isVerified = c.verification?.verificationStatus === 'VISUALLY_VERIFIED';
            const evidenceCount = c.evidence.length;
            const mergeCount = c.mergeHistory.length;

            return (
              <div
                key={c.id}
                onClick={() => onSelectCase(c.id)}
                className={`p-3.5 cursor-pointer transition-all border-l-4 ${
                  isSelected
                    ? 'bg-slate-900/90 border-l-sky-500 shadow-md'
                    : 'bg-transparent border-l-transparent hover:bg-slate-900/40'
                }`}
              >
                {/* Header: ID + Status + Severity */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-sky-400">
                      {c.id}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${getSeverityBadgeColor(
                        c.severity
                      )}`}
                    >
                      {c.severity}
                    </span>
                  </div>
                  {getStatusBadge(c.status, isVerified)}
                </div>

                {/* Case Title */}
                <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 leading-snug">
                  {c.title}
                </h4>

                {/* Location Landmark */}
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-mono truncate">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">{c.zone} — {c.landmark}</span>
                </div>

                {/* Footer Metadata: Priority + Evidence Counts */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-slate-300">
                      <ImageIcon className="w-3 h-3 text-slate-400" />
                      {evidenceCount} {evidenceCount === 1 ? 'photo' : 'photos'}
                    </span>
                    {mergeCount > 0 && (
                      <span className="flex items-center gap-0.5 text-purple-400 font-bold bg-purple-950/40 px-1 py-0.2 rounded border border-purple-500/20">
                        <GitMerge className="w-2.5 h-2.5" />
                        {mergeCount} merged
                      </span>
                    )}
                  </div>

                  <span className="font-bold text-amber-400">
                    Priority: {c.priorityScore}/100
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
