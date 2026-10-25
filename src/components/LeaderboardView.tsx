import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Search, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import type { LeaderboardPeriod, LeaderboardFilter } from '../types/reputation';
import { getLeaderboard } from '../services/reputation';
import type { UserAccount } from '../types/auth';

interface LeaderboardViewProps {
  currentUser: UserAccount | null;
  onSelectContributor: (userId: string) => void;
  onNavigateToReports: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  currentUser,
  onSelectContributor,
  onNavigateToReports,
}) => {
  const [period, setPeriod] = useState<LeaderboardPeriod>('all-time');
  const [filter, setFilter] = useState<LeaderboardFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const rankings = useMemo(() => {
    const list = getLeaderboard(period, filter);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(r => r.displayName.toLowerCase().includes(q));
  }, [period, filter, searchQuery]);

  const userRank = useMemo(() => {
    if (!currentUser) return null;
    return rankings.find(r => r.userId === currentUser.id);
  }, [rankings, currentUser]);

  return (
    <div className="flex-1 overflow-y-auto overscroll-y-contain bg-slate-50 min-h-full">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header (macOS Frosted Glass Card) */}
        <div className="backdrop-blur-xl bg-white/80 border border-slate-200/70 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shadow-xs">
              <Trophy className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Contributor Reputation &amp; Rankings
              </h1>
              <p className="text-xs text-slate-500">
                Transparent civic recognition based strictly on verified field submissions
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
            Points are earned when community members identify valid infrastructure defects (+10) and when authorized maintenance resolvers complete certified repairs (+20). Rankings are deterministically calculated.
          </p>

          {/* Current User Quick Rank Banner */}
          {currentUser && (
            <div className="mt-2 p-3 rounded-2xl bg-blue-50/70 border border-blue-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  {userRank ? `#${userRank.rank}` : '—'}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Your Standing: {currentUser.displayName}
                  </span>
                  <span className="text-[11px] text-blue-700">
                    {userRank ? `${userRank.totalPoints} pts earned (${userRank.verifiedContributions} contributions)` : 'No scored contributions yet'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectContributor(currentUser.id)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
              >
                View Profile
              </button>
            </div>
          )}
        </div>

        {/* Filter Controls (macOS Segmented Bar) */}
        <div className="backdrop-blur-xl bg-white/80 border border-slate-200/70 rounded-2xl p-3 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Period Selector */}
            <div className="flex bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/60 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPeriod('all-time')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  period === 'all-time'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setPeriod('this-month')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  period === 'this-month'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                This Month
              </button>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search contributor..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-xl font-medium transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Contributors
            </button>
            <button
              type="button"
              onClick={() => setFilter('reporters')}
              className={`px-3 py-1 rounded-xl font-medium transition-all ${
                filter === 'reporters'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Problem Identifiers
            </button>
            <button
              type="button"
              onClick={() => setFilter('resolvers')}
              className={`px-3 py-1 rounded-xl font-medium transition-all ${
                filter === 'resolvers'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Problem Resolvers
            </button>
            <button
              type="button"
              onClick={() => setFilter('highest-rated')}
              className={`px-3 py-1 rounded-xl font-medium transition-all ${
                filter === 'highest-rated'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Highest Rated (Min. 2 Reviews)
            </button>
          </div>
        </div>

        {/* Leaderboard Table / Card List */}
        <div className="backdrop-blur-xl bg-white/80 border border-slate-200/70 rounded-3xl overflow-hidden shadow-xs">
          {rankings.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {rankings.map(entry => {
                const isCurrent = currentUser?.id === entry.userId;
                return (
                  <div
                    key={entry.userId}
                    onClick={() => onSelectContributor(entry.userId)}
                    className={`p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                      isCurrent
                        ? 'bg-blue-50/40 hover:bg-blue-50/70'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      {/* Rank Indicator */}
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                        {entry.rank === 1 ? (
                          <span className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-xs">
                            🥇
                          </span>
                        ) : entry.rank === 2 ? (
                          <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-900 flex items-center justify-center shadow-xs">
                            🥈
                          </span>
                        ) : entry.rank === 3 ? (
                          <span className="w-7 h-7 rounded-full bg-amber-700 text-white flex items-center justify-center shadow-xs">
                            🥉
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-sm">
                            #{entry.rank}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-2xl bg-blue-600/90 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                        {entry.displayName.slice(0, 2).toUpperCase()}
                      </div>

                      {/* Name & Role */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 truncate">
                            {entry.displayName}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                              YOU
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="capitalize">{entry.role}</span>
                          <span>•</span>
                          <span>{entry.verifiedContributions} verified {entry.verifiedContributions === 1 ? 'action' : 'actions'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Metrics: Points & Ratings */}
                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {entry.totalPoints} <span className="text-[11px] font-normal text-slate-500">pts</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {entry.averageRating > 0 ? (
                            <span className="text-amber-600 font-semibold">
                              ★ {entry.averageRating.toFixed(1)} ({entry.ratingsCount})
                            </span>
                          ) : (
                            <span className="italic">Not rated yet</span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Clean Empty State (Mandatory: Zero Fake Users) */
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Trophy className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-sm font-bold text-slate-900">
                  No Contributor Records Found
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {searchQuery
                    ? `No contributors matched "${searchQuery}".`
                    : 'Rankings are populated exclusively through verified civic inspections and confirmed repairs. No synthetic scores are ever generated.'}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNavigateToReports}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start an Inspection</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
