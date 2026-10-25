import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle,
  Plus
} from 'lucide-react';
import type { CivicCase, IssueCategory } from '../../types/case';

interface CaseFeedProps {
  cases: CivicCase[];
  selectedCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  onOpenReportModal: () => void;
}

const CATEGORIES: Array<'All' | IssueCategory> = [
  'All',
  'Accessibility',
  'Pedestrian Safety',
  'Electrical',
  'Plumbing',
  'Structural',
];

export const CaseFeed: React.FC<CaseFeedProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  onOpenReportModal,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | IssueCategory>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Resolved'>('All');

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      // Category filter
      if (selectedCategory !== 'All' && c.category !== selectedCategory) {
        return false;
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
        const matchesDesc = c.evidence.some(e => e.description.toLowerCase().includes(query));
        return matchesId || matchesTitle || matchesZone || matchesLandmark || matchesDesc;
      }

      return true;
    });
  }, [cases, selectedCategory, statusFilter, searchTerm]);

  // Clean, production-style status badge
  const renderStatusBadge = (c: CivicCase) => {
    if (c.verification?.verificationStatus === 'VISUALLY_VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Resolved
        </span>
      );
    }

    switch (c.status) {
      case 'WORK_ORDER_ISSUED':
      case 'REPAIR_IN_PROGRESS':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Assigned
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Under Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Reported
          </span>
        );
    }
  };

  // Severity indicator styling
  const renderSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            High Priority
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
            Low
          </span>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-slate-200">
      {/* Top Search & Filter Section */}
      <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search reports by location, title, keyword..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Category Horizontal Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors font-medium ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Tab Filter */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
            {(['All', 'Active', 'Resolved'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 font-medium">
            {filteredCases.length} {filteredCases.length === 1 ? 'incident' : 'incidents'}
          </span>
        </div>
      </div>

      {/* Incident List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3 space-y-2">
        {filteredCases.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-400 stroke-[1.5]" />
            <p className="text-sm font-medium text-slate-700">No matching reports found</p>
            <p className="text-xs text-slate-500">Try adjusting your search terms or filters.</p>
            <button
              type="button"
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100"
            >
              <Plus className="w-3.5 h-3.5" />
              Report New Problem
            </button>
          </div>
        ) : (
          filteredCases.map(c => {
            const isSelected = selectedCaseId === c.id;
            const primaryPhoto = c.evidence[0]?.imageUrl;
            const photosCount = c.evidence.length;

            return (
              <div
                key={c.id}
                onClick={() => onSelectCase(c.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-500/20'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                {/* Header: Category Badge + Status Badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider text-[11px]">
                    {c.category}
                  </span>
                  {renderStatusBadge(c)}
                </div>

                {/* Main Card Content with Photo Thumbnail */}
                <div className="flex items-start gap-3">
                  {primaryPhoto && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <img
                        src={primaryPhoto}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
                      {c.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.zone} — {c.landmark}</span>
                    </div>
                  </div>
                </div>

                {/* Footer: Severity + Photo Count */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs">
                  {renderSeverityBadge(c.severity)}

                  <span className="text-slate-500 flex items-center gap-1 font-medium text-[11px]">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    {photosCount} {photosCount === 1 ? 'photo' : 'photos'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
