import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ShieldCheck, 
  Printer, 
  Copy, 
  Check, 
  Upload, 
  ChevronLeft,
  Wrench,
  AlertOctagon,
  ArrowRight,
  MoreVertical,
  Trash2,
  Star,
  Activity,
  AlertCircle
} from 'lucide-react';
import type { CivicCase, ClarificationAnswer, CaseStatus } from '../../types/case';
import type { UserAccount } from '../../types/auth';
import type { RatingCategory } from '../../types/reputation';
import { copyDossierToClipboard } from '../../services/dossierExport';
import { ImageComparisonSlider } from '../../components/ImageComparisonSlider';
import { verifyRepairsMultimodal } from '../../services/ai';
import type { ApiConfig } from '../../types/ai';
import { processAndCompressImage } from '../../utils/imageUtils';
import { deleteCase, resolveCaseExplicitly } from '../../services/storage';
import { canUserDeleteReport, canUserResolveReport } from '../../services/auth';
import { submitRating, getRatingsForReport } from '../../services/ratings';
import { getActivitiesForReport } from '../../services/activity';

interface CaseDetailWorkflowProps {
  civicCase: CivicCase;
  onUpdateCase: (updatedCase: CivicCase) => void;
  onDeleteCase: (caseId: string) => void;
  currentUser: UserAccount | null;
  apiConfig: ApiConfig;
  onBackToList?: () => void;
  onOpenAuthModal?: () => void;
  onSelectContributor?: (userId: string) => void;
}

export const CaseDetailWorkflow: React.FC<CaseDetailWorkflowProps> = ({
  civicCase,
  onUpdateCase,
  onDeleteCase,
  currentUser,
  apiConfig,
  onBackToList,
  onOpenAuthModal,
  onSelectContributor,
}) => {
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [newAnswers, setNewAnswers] = useState<Record<string, string>>({});
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [comparisonMode, setComparisonMode] = useState<'slider' | 'stacked' | 'side-by-side'>('slider');

  // Menu & Modal states
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Resolution modal state
  const [isResolveModalOpen, setIsResolveModalOpen] = useState<boolean>(false);
  const [resolutionNotesInput, setResolutionNotesInput] = useState<string>('');
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Rating state
  const [selectedRatingCategory, setSelectedRatingCategory] = useState<RatingCategory>('REPORT_ACCURACY');
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [ratingSuccess, setRatingSuccess] = useState<string | null>(null);

  // After-image state for verification
  const [afterImageUrl, setAfterImageUrl] = useState<string>(
    civicCase.resolutionEvidenceUrl || civicCase.verification?.afterImageUrl || ''
  );

  const primaryEvidence = civicCase.evidence[0];
  const beforeImageUrl = primaryEvidence?.imageUrl || '';
  const ai = civicCase.aiAnalysis;

  // Real ratings and activities
  const caseRatings = getRatingsForReport(civicCase.id);
  const caseActivities = getActivitiesForReport(civicCase.id);

  // Average rating
  const averageRating = caseRatings.length > 0
    ? (caseRatings.reduce((acc, r) => acc + r.score, 0) / caseRatings.length).toFixed(1)
    : null;

  // Handle Copy Markdown Work Order
  const handleCopyMarkdown = async () => {
    setIsMenuOpen(false);
    const success = await copyDossierToClipboard(civicCase);
    if (success) {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  // Handle Print Dossier
  const handlePrintDossier = () => {
    setIsMenuOpen(false);
    window.print();
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = deleteCase(civicCase.id, currentUser, apiConfig.isDemoMode);
      if (result.success) {
        setIsDeleteModalOpen(false);
        onDeleteCase(civicCase.id);
      } else {
        setDeleteError(result.error || 'Failed to delete report.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Explicit Resolution Submission
  const handleConfirmResolution = () => {
    setIsResolving(true);
    setResolveError(null);
    try {
      const result = resolveCaseExplicitly(
        civicCase.id,
        currentUser,
        resolutionNotesInput,
        afterImageUrl,
        apiConfig.isDemoMode
      );

      if (result.success && result.updatedCase) {
        onUpdateCase(result.updatedCase);
        setIsResolveModalOpen(false);
        setStatusToast('Case marked resolved and resolution points awarded.');
        setTimeout(() => setStatusToast(null), 3000);
      } else {
        setResolveError(result.error || 'Failed to resolve case.');
      }
    } finally {
      setIsResolving(false);
    }
  };

  // Handle Rating Submission
  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRatingError(null);
    setRatingSuccess(null);

    if (!currentUser) {
      onOpenAuthModal?.();
      return;
    }

    // Determine target user based on category
    let targetUserId = '';
    if (selectedRatingCategory === 'REPORT_ACCURACY') {
      targetUserId = civicCase.createdBy || '';
    } else if (selectedRatingCategory === 'RESOLUTION_QUALITY') {
      targetUserId = civicCase.resolvedById || '';
    } else {
      targetUserId = civicCase.createdBy || civicCase.resolvedById || '';
    }

    if (!targetUserId) {
      setRatingError('Attributed contributor not recorded for this legacy report.');
      return;
    }

    const result = submitRating(
      civicCase,
      currentUser,
      targetUserId,
      selectedRatingCategory,
      ratingScore,
      ratingComment
    );

    if (result.success) {
      setRatingSuccess('Thank you! Your feedback has been recorded in the community audit log.');
      setRatingComment('');
      setTimeout(() => setRatingSuccess(null), 3500);
    } else {
      setRatingError(result.error || 'Failed to record rating.');
    }
  };

  // Handle human clarification answer
  const handleSaveAnswer = (question: string, questionId: string) => {
    const answerText = newAnswers[questionId]?.trim();
    if (!answerText) return;

    const answerRecord: ClarificationAnswer = {
      questionId,
      question,
      answer: answerText,
      answeredAt: new Date().toISOString(),
      answeredBy: currentUser?.displayName || 'Field Operations Reviewer',
    };

    const updatedAnswers = [
      ...civicCase.clarificationAnswers.filter(a => a.questionId !== questionId),
      answerRecord,
    ];

    const updatedCase: CivicCase = {
      ...civicCase,
      clarificationAnswers: updatedAnswers,
      updatedAt: new Date().toISOString(),
    };

    onUpdateCase(updatedCase);
    setNewAnswers(prev => ({ ...prev, [questionId]: '' }));
  };

  // Handle Status Change
  const handleStatusChange = (newStatus: CaseStatus) => {
    const updatedCase: CivicCase = {
      ...civicCase,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    onUpdateCase(updatedCase);
  };

  // Primary action based on current status
  const handlePrimaryAction = () => {
    if (civicCase.status === 'REPORTED' || civicCase.status === 'UNDER_REVIEW') {
      handleStatusChange('WORK_ORDER_ISSUED');
    } else if (civicCase.status === 'WORK_ORDER_ISSUED') {
      handleStatusChange('REPAIR_IN_PROGRESS');
    } else if (civicCase.status === 'REPAIR_IN_PROGRESS' || civicCase.status === 'VISUALLY_VERIFIED') {
      setIsResolveModalOpen(true);
    }
  };

  // Handle AI Multimodal Verification
  const handleRunVerification = async () => {
    if (!afterImageUrl) return;
    setIsVerifying(true);
    try {
      const verification = await verifyRepairsMultimodal(
        beforeImageUrl,
        afterImageUrl,
        civicCase.title,
        apiConfig
      );

      const updatedCase: CivicCase = {
        ...civicCase,
        verification,
        updatedAt: new Date().toISOString(),
      };

      onUpdateCase(updatedCase);
    } finally {
      setIsVerifying(false);
    }
  };

  const deletePermission = canUserDeleteReport(currentUser, civicCase);
  const resolvePermission = canUserResolveReport(currentUser, civicCase);

  return (
    <div className="flex-1 overflow-y-auto overscroll-y-contain bg-slate-50 min-h-full">
      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md text-white text-xs font-medium shadow-lg flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          <span>Work order copied to clipboard (Markdown)</span>
        </div>
      )}

      {statusToast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-900/90 backdrop-blur-md text-white text-xs font-medium shadow-lg flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[3]" />
          <span>{statusToast}</span>
        </div>
      )}

      {/* Main Content Container */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Mobile Back Action Bar */}
        {onBackToList && (
          <div className="lg:hidden flex items-center justify-between gap-2 mb-1">
            <button
              type="button"
              onClick={onBackToList}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 backdrop-blur-xl bg-white/80 border border-slate-200/70 px-3.5 py-2 rounded-xl shadow-xs min-h-[44px]"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
              <span>All Reports</span>
            </button>
            <span className="text-[11px] font-mono text-slate-400">{civicCase.id}</span>
          </div>
        )}

        {/* 1. Header Card (macOS Crystal Glass) */}
        <div className="backdrop-blur-xl bg-white/80 border border-slate-200/70 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-blue-700 bg-blue-50/80 border border-blue-200/60 px-2.5 py-0.5 rounded-lg">
                  {civicCase.category}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {civicCase.id}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(civicCase.createdAt).toLocaleDateString()} at {new Date(civicCase.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                {civicCase.title}
              </h1>

              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{civicCase.zone} — {civicCase.landmark}</span>
              </div>
            </div>

            {/* Status & Priority Badge + Three-Dot Menu */}
            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Status:</span>
                <span className={`font-semibold px-2.5 py-1 rounded-xl text-xs border ${
                  civicCase.status === 'RESOLVED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : civicCase.status === 'VISUALLY_VERIFIED'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-slate-100 text-slate-800 border-slate-200'
                }`}>
                  {civicCase.status.replace(/_/g, ' ')}
                </span>

                {/* Three-Dot Menu Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 shadow-xs transition-colors"
                    title="Report Actions"
                    aria-label="More actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-xl py-1.5 z-30 text-xs animate-in fade-in duration-100">
                      <button
                        type="button"
                        onClick={handleCopyMarkdown}
                        className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Markdown</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePrintDossier}
                        className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-400" />
                        <span>Print Dossier</span>
                      </button>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsDeleteModalOpen(true);
                        }}
                        className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Delete Report</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <span>Priority:</span>
                <span className={`font-semibold px-2 py-0.5 rounded-lg text-xs ${
                  civicCase.priorityScore > 85
                    ? 'bg-rose-50 text-rose-700 border border-rose-200/70'
                    : 'bg-amber-50 text-amber-700 border border-amber-200/70'
                }`}>
                  {civicCase.priorityScore}/100 ({civicCase.severity})
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            {civicCase.status !== 'RESOLVED' ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrimaryAction}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all min-h-[44px]"
                >
                  <span>
                    {civicCase.status === 'REPORTED' && 'Review & Issue Work Order'}
                    {civicCase.status === 'UNDER_REVIEW' && 'Issue Work Order'}
                    {civicCase.status === 'WORK_ORDER_ISSUED' && 'Mark Repair In Progress'}
                    {civicCase.status === 'REPAIR_IN_PROGRESS' && 'Record Official Resolution'}
                    {civicCase.status === 'VISUALLY_VERIFIED' && 'Record Official Resolution'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {/* Additional explicit resolution button for maintenance/admin */}
                {(civicCase.status === 'REPAIR_IN_PROGRESS' || civicCase.status === 'WORK_ORDER_ISSUED') && (
                  <button
                    type="button"
                    onClick={() => setIsResolveModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors min-h-[44px]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Complete &amp; Confirm Resolution</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200/80 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Case Resolved &amp; Recorded</span>
              </div>
            )}

            {/* Quick rating indicator */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>
                {averageRating ? `Rating: ★ ${averageRating} (${caseRatings.length})` : 'Not rated yet'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. ACTIVITY & ACCOUNTABILITY SECTION (REQUIRED BY USER) */}
        <div className="backdrop-blur-xl bg-white/80 border border-slate-200/70 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Activity &amp; Accountability Records
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Transparent Municipal Audit
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Reported By */}
            <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">
                Reported By
              </span>
              {civicCase.createdByName ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-sm">
                    {civicCase.createdByName}
                  </span>
                  {civicCase.createdBy && onSelectContributor && (
                    <button
                      type="button"
                      onClick={() => onSelectContributor(civicCase.createdBy!)}
                      className="text-[10px] text-blue-600 hover:underline font-semibold"
                    >
                      (Profile)
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-slate-500 italic block">
                  Legacy report — creator not recorded
                </span>
              )}
              <span className="text-[11px] text-slate-400 block">
                Reported {new Date(civicCase.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Assigned To */}
            <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">
                Assigned To
              </span>
              <strong className="text-slate-900 font-semibold text-sm block">
                {civicCase.assignedTo || civicCase.assignedTeam || 'Not assigned'}
              </strong>
              <span className="text-[11px] text-slate-400 block">
                Target SLA: {civicCase.estimatedResponseTarget || 'Standard Tier'}
              </span>
            </div>

            {/* Resolution */}
            <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">
                Resolution Status
              </span>
              {civicCase.status === 'RESOLVED' ? (
                <div>
                  <strong className="text-emerald-700 font-bold text-sm block">
                    Resolved by {civicCase.resolvedBy || 'Maintenance Team'}
                  </strong>
                  <span className="text-[11px] text-slate-500 block">
                    {civicCase.resolvedAt ? new Date(civicCase.resolvedAt).toLocaleDateString() : 'Date not recorded'}
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-slate-600 font-medium block">Not resolved yet</span>
                  <span className="text-[11px] text-slate-400 block">
                    Awaiting contractor or technician sign-off
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Resolution Notes If Submitted */}
          {civicCase.resolutionNotes && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <strong className="block font-bold">Authorized Resolution Notes:</strong>
              <p className="leading-relaxed">{civicCase.resolutionNotes}</p>
            </div>
          )}
        </div>

        {/* 3. Primary Photographic Evidence */}
        <div className="backdrop-blur-xl bg-white/80 border border-slate-200/70 rounded-3xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
              <span>Primary Photographic Evidence</span>
              <span className="text-[11px] text-slate-400 font-normal">
                ({civicCase.evidence.length} {civicCase.evidence.length === 1 ? 'submission' : 'submissions'})
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{primaryEvidence?.reporterLabel || 'Campus Reporter'}</span>
            </div>
          </div>

          <div className="w-full bg-slate-900/5 aspect-16/10 sm:aspect-16/9 overflow-hidden flex items-center justify-center">
            {beforeImageUrl ? (
              <img
                src={beforeImageUrl}
                alt="Reported infrastructure damage"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-slate-400 text-xs">No image provided</div>
            )}
          </div>

          {primaryEvidence?.description && (
            <div className="p-4 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-700 leading-relaxed">
              <p className="font-semibold text-slate-900 mb-0.5">Field Observation:</p>
              <p className="text-slate-600">{primaryEvidence.description}</p>
            </div>
          )}
        </div>

        {/* 4. AI Inspection Findings */}
        <div className="backdrop-blur-xl bg-white/80 border border-slate-200/70 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                AI Inspection Findings
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {ai?.isSimulated ? 'Simulated Inspection' : `Engine: ${ai?.modelUsed || apiConfig.selectedModel}`}
            </span>
          </div>

          <div className="space-y-3.5">
            {/* Observed Physical Evidence */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2">
              <div className="text-xs font-bold text-slate-800 tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Observed Physical Evidence
              </div>
              <div className="space-y-1.5 pt-1">
                {ai?.detectedHazards && ai.detectedHazards.length > 0 ? (
                  ai.detectedHazards.map((hazard, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-800">
                      <span className="text-blue-600 font-bold shrink-0 mt-0.5">•</span>
                      <span>{hazard}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No physical hazards logged.</p>
                )}
              </div>

              {ai?.accessibilityImpact && (
                <div className="pt-2 text-xs text-slate-600 border-t border-slate-200/60">
                  <strong className="text-slate-800">Accessibility Impact:</strong> {ai.accessibilityImpact}
                </div>
              )}
            </div>

            {/* Needs Verification */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-3">
              <div className="text-xs font-bold text-amber-900 tracking-wider uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Needs Verification (Human Confirmation)
              </div>
              
              <div className="space-y-1.5">
                {ai?.uncertaintyFlags && ai.uncertaintyFlags.length > 0 ? (
                  ai.uncertaintyFlags.map((flag, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-900">
                      <span className="text-amber-600 shrink-0">⚠️</span>
                      <span>{flag}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-amber-800">Field conditions require physical verification.</p>
                )}
              </div>

              {/* Clarification Prompts */}
              {ai?.clarifyingQuestions && ai.clarifyingQuestions.length > 0 && (
                <div className="pt-2 border-t border-amber-200/70 space-y-2.5">
                  <span className="text-xs font-semibold text-amber-900 block">
                    Field Verification Prompts:
                  </span>

                  {ai.clarifyingQuestions.map((q, idx) => {
                    const qId = `q-${idx}`;
                    const answered = civicCase.clarificationAnswers.find(
                      a => a.questionId === qId || a.question === q
                    );

                    return (
                      <div key={idx} className="bg-white/90 p-3 rounded-xl border border-amber-200/80 text-xs space-y-1.5">
                        <div className="font-medium text-slate-900">
                          {q}
                        </div>

                        {answered ? (
                          <div className="bg-emerald-50/80 text-emerald-800 p-2 rounded-lg border border-emerald-200/70 flex items-start justify-between gap-2">
                            <div>
                              <strong>Field Answer:</strong> {answered.answer}
                              <div className="text-[10px] text-emerald-600 mt-0.5">
                                Verified by {answered.answeredBy}
                              </div>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          </div>
                        ) : (
                          <div className="flex gap-2 pt-1">
                            <input
                              type="text"
                              value={newAnswers[qId] || ''}
                              onChange={e =>
                                setNewAnswers(prev => ({ ...prev, [qId]: e.target.value }))
                              }
                              placeholder="Record on-site human answer..."
                              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveAnswer(q, qId)}
                              disabled={!newAnswers[qId]?.trim()}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Suggested Next Step */}
            <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200/60 space-y-1.5">
              <div className="text-xs font-bold text-blue-900 tracking-wider uppercase flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-blue-600" />
                Suggested Next Step
              </div>
              <p className="text-xs text-blue-950 font-medium">
                {ai?.recommendedAction || 'Schedule physical maintenance dispatch.'}
              </p>
              {ai?.urgencyRationale && (
                <p className="text-[11px] text-blue-800">
                  Urgency justification: {ai.urgencyRationale}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 5. Visual Repair Verification Section */}
        <div id="section-verification" className="backdrop-blur-xl bg-white/80 border border-slate-200/70 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Visual Repair Verification
                </h2>
                <p className="text-[11px] text-slate-400">
                  Multimodal photographic comparison of reported incident vs completed repair
                </p>
              </div>
            </div>

            {/* If After-Image exists, allow toggling comparison modes and uploading a new one */}
            {afterImageUrl && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/70 text-xs">
                  <button
                    type="button"
                    onClick={() => setComparisonMode('slider')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      comparisonMode === 'slider'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Slider
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparisonMode('stacked')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      comparisonMode === 'stacked'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Stacked
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparisonMode('side-by-side')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors hidden sm:block ${
                      comparisonMode === 'side-by-side'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Side by Side
                  </button>
                </div>

                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/70 cursor-pointer transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Replace Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const processed = await processAndCompressImage(file, 1600, 0.85);
                          setAfterImageUrl(processed.dataUrl);
                        } catch {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setAfterImageUrl(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleRunVerification}
                  disabled={isVerifying}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isVerifying ? 'Comparing...' : 'Run AI Verification'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Verification Display */}
          {afterImageUrl ? (
            <div className="space-y-4">
              {comparisonMode === 'slider' ? (
                <ImageComparisonSlider
                  beforeUrl={beforeImageUrl}
                  afterUrl={afterImageUrl}
                  beforeLabel="Before (Reported Incident)"
                  afterLabel="After (Contractor Repair)"
                />
              ) : comparisonMode === 'stacked' ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Before Repair (Reported Incident)
                    </span>
                    <div className="w-full aspect-16/10 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img src={beforeImageUrl} alt="Before repair" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      After Repair (Submitted Evidence)
                    </span>
                    <div className="w-full aspect-16/10 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img src={afterImageUrl} alt="After repair" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Before Repair
                    </span>
                    <div className="w-full aspect-16/10 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img src={beforeImageUrl} alt="Before" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      After Repair
                    </span>
                    <div className="w-full aspect-16/10 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img src={afterImageUrl} alt="After" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              )}

              {/* Verified Results */}
              {civicCase.verification ? (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-950">
                        Verification Status: {civicCase.verification.verificationStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800">
                      Confidence: {Math.round(civicCase.verification.confidenceScore * 100)}%
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-emerald-900">
                    <strong className="block text-slate-800">Observed Physical Changes:</strong>
                    {civicCase.verification.visualChangesObserved.map((change, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{change}</span>
                      </div>
                    ))}
                  </div>

                  {civicCase.verification.remainingConcerns.length > 0 && (
                    <div className="pt-2 border-t border-emerald-200/70 text-xs text-amber-900">
                      <strong className="block text-amber-950 mb-0.5">Remaining Advisory:</strong>
                      {civicCase.verification.remainingConcerns.map((concern, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span>⚠️</span>
                          <span>{concern}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-center text-xs text-slate-500">
                  After-repair photograph loaded. Note: Uploading evidence does not mark the report resolved; resolution must be explicitly confirmed by an authorized resolver.
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-3xl border-2 border-dashed border-slate-200/80 bg-slate-50/50 text-center space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center mx-auto text-slate-400">
                <Upload className="w-5 h-5 text-slate-400" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-xs font-bold text-slate-900">
                  No Repair Evidence Submitted Yet
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Upload an after-repair photograph from the field to perform automated visual comparison against the reported damage.
                </p>
              </div>

              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs active:scale-95 transition-all">
                  <Upload className="w-4 h-4" />
                  <span>Upload After-Repair Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const processed = await processAndCompressImage(file, 1600, 0.85);
                          setAfterImageUrl(processed.dataUrl);
                        } catch {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setAfterImageUrl(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Statutory Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200/70 text-[11px] text-slate-600 flex items-start gap-2.5 leading-relaxed">
            <AlertOctagon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <strong>Compliance Notice:</strong> Visual verification confirms automated 2D photographic changes only. Structural clearance and municipal building sign-off require authorized on-site certification.
            </div>
          </div>
        </div>

        {/* 6. RATINGS & REVIEWS SECTION (REQUIRED BY USER) */}
        <div className="backdrop-blur-xl bg-white/80 border border-slate-200/70 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Community Ratings &amp; Peer Review
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {caseRatings.length} {caseRatings.length === 1 ? 'Review' : 'Reviews'}
            </span>
          </div>

          {/* Rating Form */}
          <form onSubmit={handleRatingSubmit} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800">
                Submit Quality Feedback
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingScore(star)}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= ratingScore
                          ? 'text-amber-500 fill-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 ml-1.5">{ratingScore} / 5</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedRatingCategory('REPORT_ACCURACY')}
                className={`py-1.5 px-2.5 rounded-xl border text-center transition-all ${
                  selectedRatingCategory === 'REPORT_ACCURACY'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Report Accuracy
              </button>
              <button
                type="button"
                onClick={() => setSelectedRatingCategory('RESOLUTION_QUALITY')}
                className={`py-1.5 px-2.5 rounded-xl border text-center transition-all ${
                  selectedRatingCategory === 'RESOLUTION_QUALITY'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Resolution Quality
              </button>
              <button
                type="button"
                onClick={() => setSelectedRatingCategory('COMMUNICATION_CLARITY')}
                className={`py-1.5 px-2.5 rounded-xl border text-center transition-all ${
                  selectedRatingCategory === 'COMMUNICATION_CLARITY'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Clarity
              </button>
            </div>

            <div>
              <input
                type="text"
                value={ratingComment}
                onChange={e => setRatingComment(e.target.value)}
                placeholder="Optional constructive note regarding evidence quality, resolution accuracy..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {ratingError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{ratingError}</span>
              </div>
            )}

            {ratingSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{ratingSuccess}</span>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
              >
                Submit Rating
              </button>
            </div>
          </form>

          {/* Existing Ratings List */}
          {caseRatings.length > 0 ? (
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-slate-700 block">
                Recorded Reviews ({caseRatings.length})
              </span>
              <div className="space-y-2">
                {caseRatings.map(r => (
                  <div key={r.id} className="p-3 rounded-2xl bg-white border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{r.reviewerName}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.2 rounded-full font-medium">
                          {r.category.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center text-amber-500 font-bold">
                        {'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="text-slate-600 text-xs italic">"{r.comment}"</p>
                    )}
                    <span className="text-[10px] text-slate-400 block">
                      Reviewed on {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
              No ratings submitted yet for this report. Eligible participants can submit verified feedback above.
            </div>
          )}
        </div>

        {/* 7. IMMUTABLE ACTIVITY AUDIT TIMELINE */}
        <div className="backdrop-blur-xl bg-white/80 border border-slate-200/70 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Activity Audit Trail
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Immutable Records
            </span>
          </div>

          {caseActivities.length > 0 ? (
            <div className="space-y-2.5">
              {caseActivities.map(act => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        {act.actionType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{act.details}</p>
                    <span className="text-[10px] text-slate-400">Actor: {act.actorName} ({act.actorRole})</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
              Initial creation logged. Audit items are appended as status transitions and ratings are recorded.
            </div>
          )}
        </div>
      </div>

      {/* DELETE CONFIRMATION DIALOG (macOS Frosted Glass) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Delete Incident Report?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  This will permanently delete report <strong>{civicCase.id}</strong> ("{civicCase.title}") from active municipal records. An immutable audit trail of this deletion will be preserved for accountability.
                </p>
              </div>
            </div>

            {!deletePermission.allowed && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{deletePermission.reason}</span>
              </div>
            )}

            {deleteError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting || !deletePermission.allowed}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
              >
                {isDeleting ? 'Deleting...' : 'Delete Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPLICIT RESOLUTION CONFIRMATION MODAL */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Record Official Repair Resolution
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Explicitly certifies that physical repair work has been performed. This permanently marks the case resolved and awards <strong>+20 resolution points</strong> to your account.
                </p>
              </div>
            </div>

            {!resolvePermission.allowed && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{resolvePermission.reason}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Resolution Notes (Required)
              </label>
              <textarea
                rows={3}
                required
                value={resolutionNotesInput}
                onChange={e => setResolutionNotesInput(e.target.value)}
                placeholder="Describe the materials replaced, contractor details, or repair work completed..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {resolveError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{resolveError}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsResolveModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolution}
                disabled={isResolving || !resolvePermission.allowed || !resolutionNotesInput.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
              >
                {isResolving ? 'Recording...' : 'Confirm Resolution (+20 pts)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
