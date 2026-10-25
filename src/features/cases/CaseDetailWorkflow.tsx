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
  Layers,
  Wrench,
  AlertOctagon,
  FileText,
  ArrowRight
} from 'lucide-react';
import type { CivicCase, ClarificationAnswer, CaseStatus } from '../../types/case';
import { copyDossierToClipboard } from '../../services/dossierExport';
import { ImageComparisonSlider } from '../../components/ImageComparisonSlider';
import { verifyRepairsMultimodal } from '../../services/ai';
import type { ApiConfig } from '../../types/ai';
import { processAndCompressImage } from '../../utils/imageUtils';

interface CaseDetailWorkflowProps {
  civicCase: CivicCase;
  onUpdateCase: (updatedCase: CivicCase) => void;
  apiConfig: ApiConfig;
  onBackToList?: () => void;
}

export const CaseDetailWorkflow: React.FC<CaseDetailWorkflowProps> = ({
  civicCase,
  onUpdateCase,
  apiConfig,
  onBackToList,
}) => {
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [newAnswers, setNewAnswers] = useState<Record<string, string>>({});
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [comparisonMode, setComparisonMode] = useState<'slider' | 'stacked' | 'side-by-side'>('slider');

  // After-image state for genuine verification (only populated if case has verification record)
  const [afterImageUrl, setAfterImageUrl] = useState<string>(
    civicCase.verification?.afterImageUrl || ''
  );

  const primaryEvidence = civicCase.evidence[0];
  const beforeImageUrl = primaryEvidence?.imageUrl || '';
  const ai = civicCase.aiAnalysis;

  // Handle Copy Markdown Work Order
  const handleCopyMarkdown = async () => {
    const success = await copyDossierToClipboard(civicCase);
    if (success) {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  // Handle Print Dossier
  const handlePrintDossier = () => {
    window.print();
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
      answeredBy: 'Field Operations Reviewer',
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
    } else if (civicCase.status === 'REPAIR_IN_PROGRESS') {
      const el = document.getElementById('section-verification');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (civicCase.status === 'VISUALLY_VERIFIED') {
      handleStatusChange('RESOLVED');
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
        status:
          verification.verificationStatus === 'VISUALLY_VERIFIED'
            ? 'VISUALLY_VERIFIED'
            : 'UNDER_REVIEW',
        updatedAt: new Date().toISOString(),
      };

      onUpdateCase(updatedCase);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto overscroll-y-contain bg-slate-50 min-h-full">
      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md text-white text-xs font-medium shadow-lg flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          <span>Work order copied to clipboard (Markdown)</span>
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

        {/* 1. Header Card (Apple Crystal Glass) */}
        <div className="backdrop-blur-xl bg-white/80 border border-slate-200/70 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
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

            {/* Status & Priority Badge */}
            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Status:</span>
                <select
                  value={civicCase.status}
                  onChange={e => handleStatusChange(e.target.value as CaseStatus)}
                  aria-label="Case Status"
                  className="bg-white/80 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-2.5 py-1.5 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="REPORTED">Reported</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="WORK_ORDER_ISSUED">Work Order Issued</option>
                  <option value="REPAIR_IN_PROGRESS">Repair in Progress</option>
                  <option value="VISUALLY_VERIFIED">Visually Verified</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
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

          {/* Single Primary Action + Secondary Utilities */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            {/* Primary Action Button */}
            {civicCase.status !== 'RESOLVED' ? (
              <button
                type="button"
                onClick={handlePrimaryAction}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all min-h-[44px]"
              >
                <span>
                  {civicCase.status === 'REPORTED' && 'Review & Issue Work Order'}
                  {civicCase.status === 'UNDER_REVIEW' && 'Issue Work Order'}
                  {civicCase.status === 'WORK_ORDER_ISSUED' && 'Mark Repair In Progress'}
                  {civicCase.status === 'REPAIR_IN_PROGRESS' && 'Go to Visual Verification'}
                  {civicCase.status === 'VISUALLY_VERIFIED' && 'Mark Case Resolved'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Case Resolved & Closed</span>
              </div>
            )}

            {/* Secondary Utilities: Copy Work Order & Print */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/80 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/70 transition-colors min-h-[40px]"
                title="Copy structured work order in Markdown format"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Copy Markdown</span>
              </button>

              <button
                type="button"
                onClick={handlePrintDossier}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/80 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/70 transition-colors min-h-[40px]"
                title="Print incident dossier"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Print / PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Main Evidence Photograph */}
        <div className="backdrop-blur-xl bg-white/80 border border-slate-200/70 rounded-2xl overflow-hidden shadow-xs">
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

        {/* 3. AI Inspection Findings */}
        <div className="backdrop-blur-xl bg-white/80 border border-slate-200/70 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
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
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-2">
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
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/70 space-y-3">
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
            <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-200/60 space-y-1.5">
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

        {/* 4. Corroborating Evidence Submissions (if any merged duplicates) */}
        {civicCase.evidence.length > 1 && (
          <div className="backdrop-blur-xl bg-white/80 border border-slate-200/70 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">
                  Corroborating Evidence ({civicCase.evidence.length} Photos)
                </h2>
              </div>
              <span className="text-[11px] text-slate-500">
                {civicCase.mergeHistory.length} Merged Duplicates
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {civicCase.evidence.map(ev => (
                <div key={ev.id} className="border border-slate-200/70 rounded-xl overflow-hidden bg-white/60">
                  <div className="w-full aspect-16/10 bg-slate-100 overflow-hidden">
                    <img
                      src={ev.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{ev.reporterLabel}</span>
                      <span className="text-slate-400 text-[10px]">{new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-600 text-xs">{ev.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Maintenance Work Order Card */}
        <div className="backdrop-blur-xl bg-white/80 border border-slate-200/70 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Maintenance Work Order
              </h2>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
              Target SLA: {civicCase.estimatedResponseTarget?.split(' ')[0] || 'Standard'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70">
            <div>
              <span className="text-slate-500 block text-[11px]">Assigned Division:</span>
              <strong className="text-slate-900 font-semibold text-xs">{civicCase.assignedTeam || 'Facilities Dispatch'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Priority Scoring:</span>
              <strong className="text-slate-900 font-semibold text-xs">{civicCase.priorityScore} / 100</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Dispatch Target:</span>
              <strong className="text-slate-900 font-semibold text-xs">{civicCase.estimatedResponseTarget || 'Within 24 Hours'}</strong>
            </div>
          </div>
        </div>

        {/* 6. Visual Repair Verification (Genuine Multimodal Comparison) */}
        <div id="section-verification" className="backdrop-blur-xl bg-white/80 border border-slate-200/70 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
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

          {/* Genuine Verification Content */}
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
                    <div className="w-full aspect-16/10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img src={beforeImageUrl} alt="Before repair" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      After Repair (Submitted Evidence)
                    </span>
                    <div className="w-full aspect-16/10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
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
                    <div className="w-full aspect-16/10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img src={beforeImageUrl} alt="Before" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      After Repair
                    </span>
                    <div className="w-full aspect-16/10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img src={afterImageUrl} alt="After" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              )}

              {/* Verified Results */}
              {civicCase.verification ? (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
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
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-center text-xs text-slate-500">
                  After-repair photograph loaded. Click <strong>Run AI Verification</strong> above to perform multimodal vision comparison.
                </div>
              )}
            </div>
          ) : (
            /* Clean Empty State when no after-photo has been submitted */
            <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200/80 bg-slate-50/50 text-center space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center mx-auto text-slate-400">
                <Upload className="w-5 h-5 text-slate-400" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-xs font-bold text-slate-900">
                  No Repair Evidence Submitted Yet
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Upload an after-repair photograph from the field to perform automated multimodal visual verification against the reported incident.
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

          {/* Statutory Compliance Notice */}
          <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200/70 text-[11px] text-slate-600 flex items-start gap-2.5 leading-relaxed">
            <AlertOctagon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <strong>Compliance Notice:</strong> Visual verification confirms automated 2D photographic changes only and does not certify statutory engineering compliance, structural load safety, or municipal building code approval. An authorized safety engineer must perform on-site certification prior to unrestricted reopening.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
