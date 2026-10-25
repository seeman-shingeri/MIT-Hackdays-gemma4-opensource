import React from 'react';
import { 
  X, 
  Award, 
  Star, 
  Calendar, 
  Activity,
  Sparkles
} from 'lucide-react';
import type { PublicUserProfile } from '../types/auth';
import { loadAllTransactions } from '../services/reputation';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PublicUserProfile | null;
  currentUserId?: string;
  onViewReport?: (reportId: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentUserId,
  onViewReport,
}) => {
  if (!isOpen || !profile) return null;

  const isSelf = currentUserId === profile.id;
  const userTransactions = loadAllTransactions().filter(t => t.userId === profile.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Contributor Profile
            </span>
            {isSelf && (
              <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                Your Account
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Identity & Avatar Card */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-xs shrink-0">
              {profile.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {profile.displayName}
                </h2>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${
                  profile.role === 'admin'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : profile.role === 'maintenance'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {profile.role === 'admin' ? 'Administrator' : profile.role === 'maintenance' ? 'Maintenance Resolver' : 'Community Reporter'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {profile.maskedEmail}
              </p>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Contributor since {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Points Breakdown Matrix */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                Total Score
              </span>
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {profile.totalPoints}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Points</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100">
              <span className="text-[10px] text-blue-600 uppercase font-semibold block mb-0.5">
                Identification
              </span>
              <span className="text-2xl font-bold text-blue-700 tracking-tight">
                {profile.identificationPoints}
              </span>
              <span className="text-[10px] text-blue-600 block mt-0.5">
                {profile.validReportsCount} reports
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-[10px] text-emerald-600 uppercase font-semibold block mb-0.5">
                Resolution
              </span>
              <span className="text-2xl font-bold text-emerald-700 tracking-tight">
                {profile.resolutionPoints}
              </span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">
                {profile.verifiedResolutionsCount} repairs
              </span>
            </div>
          </div>

          {/* Reputation & Ratings Summary */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center">
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Community Review Rating
                </span>
                <span className="text-[11px] text-slate-500">
                  Evaluated on accuracy, resolution quality &amp; clarity
                </span>
              </div>
            </div>

            <div className="text-right">
              {profile.ratingsCount > 0 ? (
                <div>
                  <span className="text-base font-bold text-amber-700">
                    ★ {profile.averageRating.toFixed(1)}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    ({profile.ratingsCount} {profile.ratingsCount === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">
                  Not rated yet
                </span>
              )}
            </div>
          </div>

          {/* Earned Badges */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-600" />
                Earned Badges ({profile.badges.length})
              </span>
              <span className="text-slate-400 text-[11px]">Earned via verified activity</span>
            </div>

            {profile.badges.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {profile.badges.map((badge, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-2.5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{badge}</span>
                      <span className="text-[10px] text-slate-400">Verified Achievement</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                No badges earned yet. Submit valid civic reports or complete repairs to earn badges.
              </div>
            )}
          </div>

          {/* Recent Point Transactions History */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-slate-500" />
              Recent Contribution Audit Trail
            </span>

            {userTransactions.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {userTransactions.slice(0, 8).map(tx => (
                  <div
                    key={tx.id}
                    className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-800">{tx.reason}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Case: {tx.reportId} • {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold text-xs ${
                        tx.points >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {tx.points >= 0 ? `+${tx.points}` : tx.points}
                      </span>
                      {onViewReport && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onViewReport(tx.reportId);
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 underline font-medium"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                No verified transactions recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
