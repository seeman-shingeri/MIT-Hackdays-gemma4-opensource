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
  FileText
} from 'lucide-react';
import type { CivicCase, ClarificationAnswer, CaseStatus } from '../../types/case';
import { copyDossierToClipboard } from '../../services/dossierExport';
import { ImageComparisonSlider } from '../../components/ImageComparisonSlider';
import { repairedRampSvg } from '../../data/presetAssets';
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

  // After-image state for verification
  const [afterImageUrl, setAfterImageUrl] = useState<string>(
    civicCase.verification?.afterImageUrl || repairedRampSvg
  );

  const primaryEvidence = civicCase.evidence[0];
  const beforeImageUrl = primaryEvidence?.imageUrl || '';
  const ai = civicCase.aiAnalysis;

  // Handle Copy Markdown Work Order
  const handleCopyMarkdown = async () => {
    const success = await copyDossierToClipboard(civicCase);
    if (success) {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
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

  // Handle AI Multimodal Verification
  const handleRunVerification = async () => {
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
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-full">
      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium shadow-lg flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          <span>Work order copied to clipboard (Markdown)</span>
        </div>
      )}

      {/* Main Content Container */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Mobile Back Action Button & Active Case Bar */}
        {onBackToList && (
          <div className="lg:hidden flex items-center justify-between gap-2 mb-2 py-1">
            <button
              type="button"
              onClick={onBackToList}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-xs min-h-[44px]"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
              <span>All Reports</span>
            </button>
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-500">Case ID: {civicCase.id}</span>
            </div>
          </div>
        )}

        {/* 5-Stage Interactive Workflow Stepper */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 p-2 shadow-xs">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => document.getElementById('section-capture')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100 min-h-[44px] sm:min-h-[36px]"
            >
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
              <span>Capture Reality</span>
            </button>

            <button
              type="button"
              onClick={() => document.getElementById('section-analysis')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap text-slate-600 hover:text-slate-900 hover:bg-slate-100 min-h-[44px] sm:min-h-[36px]"
            >
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Gemma Analysis</span>
            </button>

            <button
              type="button"
              onClick={() => document.getElementById('section-duplicates')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap text-slate-600 hover:text-slate-900 hover:bg-slate-100 min-h-[44px] sm:min-h-[36px]"
            >
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">3</span>
              <span>Duplicates ({civicCase.mergeHistory.length})</span>
            </button>

            <button
              type="button"
              onClick={() => document.getElementById('section-dossier')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap text-slate-600 hover:text-slate-900 hover:bg-slate-100 min-h-[44px] sm:min-h-[36px]"
            >
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">4</span>
              <span>Work Order</span>
            </button>

            <button
              type="button"
              onClick={() => document.getElementById('section-verification')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap text-slate-600 hover:text-slate-900 hover:bg-slate-100 min-h-[44px] sm:min-h-[36px]"
            >
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">5</span>
              <span>Verify Repair</span>
            </button>
          </div>
        </div>

        {/* 1. Header Section: Title, Status, and Quick Actions */}
        <div id="section-capture" className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  {civicCase.category}
                </span>
                <span className="text-slate-500 font-mono">
                  {civicCase.id}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(civicCase.createdAt).toLocaleDateString()} at {new Date(civicCase.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                {civicCase.title}
              </h1>

              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{civicCase.zone} — {civicCase.landmark}</span>
              </div>
            </div>

            {/* Status Selector & Priority Indicator */}
            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 font-medium">Status:</label>
                <select
                  value={civicCase.status}
                  onChange={e => handleStatusChange(e.target.value as CaseStatus)}
                  className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="REPORTED">Reported</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="WORK_ORDER_ISSUED">Assigned / Work Order</option>
                  <option value="REPAIR_IN_PROGRESS">Repair in Progress</option>
                  <option value="VISUALLY_VERIFIED">Visually Verified</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <span>Priority Level:</span>
                <span className={`font-semibold px-2 py-0.5 rounded text-xs ${
                  civicCase.priorityScore > 85
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {civicCase.priorityScore}/100 ({civicCase.severity})
                </span>
              </div>
            </div>
          </div>

          {/* Action Button Bar */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Reported by: <strong className="text-slate-700">{primaryEvidence?.reporterLabel || 'Campus Citizen'}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>Copy Work Order</span>
              </button>

              <button
                type="button"
                onClick={handlePrintDossier}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print / PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Main Evidence Photograph (Natural Presentation) */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span>Main Evidence Photograph</span>
              <span className="text-xs text-slate-400 font-normal">
                ({civicCase.evidence.length} {civicCase.evidence.length === 1 ? 'submission' : 'submissions'})
              </span>
            </div>
            <span className="text-xs text-slate-500">
              Verified Resolution
            </span>
          </div>

          <div className="w-full bg-slate-100 aspect-16/10 sm:aspect-16/9 overflow-hidden flex items-center justify-center">
            <img
              src={beforeImageUrl}
              alt="Reported infrastructure damage"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 text-sm text-slate-700 leading-relaxed">
            <p className="font-medium text-slate-900 mb-0.5">Reported Observation:</p>
            <p className="text-slate-600">{primaryEvidence?.description}</p>
          </div>
        </div>

        {/* 3. AI Analysis & Inspection Findings (Trustworthy & Human-Readable) */}
        <div id="section-analysis" className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">
                AI Inspection Findings
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              {ai?.isSimulated ? 'Simulated Inspection' : `Engine: ${ai?.modelUsed || apiConfig.selectedModel}`}
            </span>
          </div>

          {/* Three Differentiated Sections (OBSERVED, NEEDS VERIFICATION, SUGGESTED NEXT STEP) */}
          <div className="space-y-4">
            {/* A. OBSERVED */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-800 tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Observed Physical Evidence
              </div>
              <p className="text-xs text-slate-500">
                Identified directly from visible photographic features:
              </p>
              <div className="space-y-1.5 pt-1">
                {ai?.detectedHazards.map((hazard, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-800">
                    <span className="text-blue-600 font-bold shrink-0 mt-0.5">•</span>
                    <span>{hazard}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-xs text-slate-600 border-t border-slate-200/80">
                <strong>Accessibility Impact:</strong> {ai?.accessibilityImpact}
              </div>
            </div>

            {/* B. NEEDS VERIFICATION */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
              <div className="text-xs font-bold text-amber-900 tracking-wider uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Needs Verification (Human Confirmation Required)
              </div>
              <p className="text-xs text-amber-800">
                The following structural and safety aspects cannot be certified from photographic evidence alone:
              </p>

              <div className="space-y-1.5">
                {ai?.uncertaintyFlags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-amber-900">
                    <span className="text-amber-600 shrink-0 mt-0.5">⚠️</span>
                    <span>{flag}</span>
                  </div>
                ))}
              </div>

              {/* Clarification Prompts */}
              {ai && ai.clarifyingQuestions.length > 0 && (
                <div className="pt-2 border-t border-amber-200/80 space-y-2.5">
                  <span className="text-xs font-semibold text-amber-900 block">
                    Field Verification Questions:
                  </span>

                  {ai.clarifyingQuestions.map((q, idx) => {
                    const qId = `q-${idx}`;
                    const answered = civicCase.clarificationAnswers.find(
                      a => a.questionId === qId || a.question === q
                    );

                    return (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-amber-200 text-xs space-y-1.5">
                        <div className="font-medium text-slate-900">
                          {q}
                        </div>

                        {answered ? (
                          <div className="bg-emerald-50 text-emerald-800 p-2 rounded border border-emerald-200 flex items-start justify-between gap-2">
                            <div>
                              <strong>Field Answer:</strong> {answered.answer}
                              <div className="text-[11px] text-emerald-600 mt-0.5">
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
                              placeholder="Record human on-site confirmation..."
                              className="flex-1 bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveAnswer(q, qId)}
                              disabled={!newAnswers[qId]?.trim()}
                              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium"
                            >
                              Save Answer
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* C. SUGGESTED NEXT STEP */}
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-1.5">
              <div className="text-xs font-bold text-blue-900 tracking-wider uppercase flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-blue-600" />
                Suggested Next Step
              </div>
              <p className="text-sm text-blue-950 font-medium">
                {ai?.recommendedAction}
              </p>
              <p className="text-xs text-blue-800">
                Urgency justification: {ai?.urgencyRationale}
              </p>
            </div>
          </div>
        </div>

        {/* 4. Corroborating Evidence & Merged Duplicate Reports */}
        <div id="section-duplicates">
          {civicCase.evidence.length > 1 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Corroborating Evidence Submissions ({civicCase.evidence.length} Photos)
                  </h2>
                </div>
                <span className="text-xs text-slate-500">
                  {civicCase.mergeHistory.length} Merged Duplicates
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {civicCase.evidence.map(ev => (
                  <div key={ev.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <div className="w-full aspect-16/10 bg-slate-200 overflow-hidden">
                      <img
                        src={ev.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>{ev.reporterLabel}</span>
                        <span className="text-slate-500 font-normal">{new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-600 text-xs">{ev.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <span>Duplicate Clustering: Standalone report. No secondary submissions merged yet.</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">1 Photo</span>
            </div>
          )}
        </div>

        {/* 5. Maintenance Work Order Section */}
        <div id="section-dossier" className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">
                Maintenance Work Order
              </h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
              Target SLA: {civicCase.estimatedResponseTarget?.split(' ')[0] || '4 Hours'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block">Assigned Division:</span>
              <strong className="text-slate-900 font-medium text-sm">{civicCase.assignedTeam || 'Facilities Dispatch'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Priority Scoring:</span>
              <strong className="text-slate-900 font-medium text-sm">{civicCase.priorityScore} / 100</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Dispatch SLA (Non-binding):</span>
              <strong className="text-slate-900 font-medium text-sm">{civicCase.estimatedResponseTarget || 'Standard Tier'}</strong>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-500">
            <span>Ready for municipal ticketing &amp; facilities export.</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="min-h-[44px] px-3.5 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-medium transition-colors"
              >
                Copy Markdown Ticket
              </button>
              <button
                type="button"
                onClick={handlePrintDossier}
                className="min-h-[44px] px-3.5 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 font-medium transition-colors"
              >
                Print Work Order
              </button>
            </div>
          </div>
        </div>

        {/* 6. Visual Repair Verification (Before / After Inspection) */}
        <div id="section-verification" className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Visual Repair Verification
                </h2>
                <p className="text-xs text-slate-500">
                  Compare reported damage against submitted repair evidence
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Comparison Mode Toggle */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setComparisonMode('slider')}
                  className={`min-h-[34px] px-2.5 py-1 rounded-md font-medium transition-colors ${
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
                  className={`min-h-[34px] px-2.5 py-1 rounded-md font-medium transition-colors ${
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
                  className={`min-h-[34px] px-2.5 py-1 rounded-md font-medium transition-colors hidden sm:block ${
                    comparisonMode === 'side-by-side'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Side by Side
                </button>
              </div>

              {/* Upload After-Image Action with mobile compression */}
              <label className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>Upload After-Photo</span>
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
                        // Fallback to simple FileReader
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

              {/* Run Verification Button */}
              <button
                type="button"
                onClick={handleRunVerification}
                disabled={isVerifying}
                className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isVerifying ? 'Comparing...' : 'Verify Repair'}
              </button>
            </div>
          </div>

          {/* Before / After Comparison Display */}
          {comparisonMode === 'slider' ? (
            <ImageComparisonSlider
              beforeUrl={beforeImageUrl}
              afterUrl={afterImageUrl}
              beforeLabel="Before (Reported Incident)"
              afterLabel="After (Contractor Repair)"
            />
          ) : comparisonMode === 'stacked' ? (
            <div className="space-y-4">
              {/* Stacked Before */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-rose-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Before Repair (Reported Incident)
                  </span>
                  <span className="text-slate-400">Original Condition</span>
                </div>
                <div className="w-full aspect-16/10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs">
                  <img src={beforeImageUrl} alt="Before repair" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Stacked After */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    After Repair (Completed Work)
                  </span>
                  <span className="text-slate-400">Post-Contractor Resolution</span>
                </div>
                <div className="w-full aspect-16/10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs">
                  <img src={afterImageUrl} alt="After repair" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Before Repair (Reported Incident)
                </span>
                <div className="w-full aspect-16/10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={beforeImageUrl} alt="Before" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  After Repair (Completed Work)
                </span>
                <div className="w-full aspect-16/10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={afterImageUrl} alt="After" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          )}

          {/* Verification Results Box */}
          {civicCase.verification ? (
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-950">
                    Visual Verification Status: Visually Verified
                  </span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Confidence: {Math.round(civicCase.verification.confidenceScore * 100)}%
                </span>
              </div>

              <div className="space-y-1 text-xs text-emerald-900">
                <strong className="block text-slate-800">Observed Physical Differences:</strong>
                {civicCase.verification.visualChangesObserved.map((change, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{change}</span>
                  </div>
                ))}
              </div>

              {civicCase.verification.remainingConcerns.length > 0 && (
                <div className="pt-2 border-t border-emerald-200 text-xs text-amber-900">
                  <strong className="block text-amber-950 mb-0.5">Remaining Caution:</strong>
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
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
              No visual verification recorded yet. Upload an after-repair image and click "Verify Repair" to run photographic difference inspection.
            </div>
          )}

          {/* Mandatory Statutory Disclaimer */}
          <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5 leading-relaxed">
            <AlertOctagon className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <strong>Compliance Notice:</strong> Visual verification confirms automated 2D photographic changes only and does not certify statutory engineering compliance, structural load safety, or municipal building code approval. An authorized safety engineer must perform on-site certification prior to unrestricted reopening.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
