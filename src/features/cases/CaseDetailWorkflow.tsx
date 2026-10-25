import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  GitMerge, 
  Printer, 
  Copy, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Layers, 
  AlertOctagon,
  Check,
  Upload
} from 'lucide-react';
import type { 
  CivicCase, 
  ClarificationAnswer, 
  CaseStatus 
} from '../../types/case';
import { copyDossierToClipboard } from '../../services/dossierExport';
import { ImageComparisonSlider } from '../../components/ImageComparisonSlider';
import { repairedRampSvg } from '../../data/presetAssets';
import { verifyRepairsMultimodal } from '../../services/ai';
import type { ApiConfig } from '../../types/ai';

interface CaseDetailWorkflowProps {
  civicCase: CivicCase;
  onUpdateCase: (updatedCase: CivicCase) => void;
  apiConfig: ApiConfig;
}

type TabType = 'analysis' | 'evidence' | 'dossier' | 'verification';

export const CaseDetailWorkflow: React.FC<CaseDetailWorkflowProps> = ({
  civicCase,
  onUpdateCase,
  apiConfig,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('analysis');
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [newAnswers, setNewAnswers] = useState<Record<string, string>>({});
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Verification tab state
  const [afterImageUrl, setAfterImageUrl] = useState<string>(
    civicCase.verification?.afterImageUrl || repairedRampSvg
  );
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');

  // Primary image
  const primaryEvidence = civicCase.evidence[0];
  const beforeImageUrl = primaryEvidence?.imageUrl || '';

  // Handle Copy Markdown
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

  // Handle answering a clarifying question
  const handleSaveAnswer = (question: string, questionId: string) => {
    const answerText = newAnswers[questionId]?.trim();
    if (!answerText) return;

    const answerRecord: ClarificationAnswer = {
      questionId,
      question,
      answer: answerText,
      answeredAt: new Date().toISOString(),
      answeredBy: 'Campus Operations Reviewer',
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

  // Handle AI Verification
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

  const ai = civicCase.aiAnalysis;

  return (
    <main className="flex-1 flex flex-col bg-[#090D16] overflow-y-auto h-full">
      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-mono text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Markdown Work Order copied to clipboard!</span>
        </div>
      )}

      {/* Case Header & Command Bar */}
      <section className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/40">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded">
                {civicCase.id}
              </span>
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded">
                {civicCase.category}
              </span>
              <span className="font-mono text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {new Date(civicCase.createdAt).toLocaleString()}
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight leading-snug">
              {civicCase.title}
            </h1>

            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{civicCase.zone} • {civicCase.landmark}</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition-colors"
              title="Copy formatted Markdown ticket"
            >
              <Copy className="w-3.5 h-3.5 text-sky-400" />
              <span>Copy MD</span>
            </button>

            <button
              type="button"
              onClick={handlePrintDossier}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition-colors"
              title="Export or print dossier PDF"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Export / Print</span>
            </button>

            {/* Status Dropdown */}
            <select
              value={civicCase.status}
              onChange={e => handleStatusChange(e.target.value as CaseStatus)}
              className="bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
            >
              <option value="REPORTED">REPORTED</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="WORK_ORDER_ISSUED">WORK ORDER ISSUED</option>
              <option value="REPAIR_IN_PROGRESS">IN PROGRESS</option>
              <option value="VISUALLY_VERIFIED">VISUALLY VERIFIED</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="flex items-center gap-2 mt-5 border-b border-slate-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('analysis')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'analysis'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Gemma Analysis & Uncertainty</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'evidence'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Evidence Gallery ({civicCase.evidence.length})</span>
            {civicCase.mergeHistory.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-purple-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dossier')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'dossier'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Maintenance Work Order</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('verification')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'verification'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Visual Verification</span>
            {civicCase.verification && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>
      </section>

      {/* Tab 1: Gemma Multimodal Analysis & Epistemic Uncertainty */}
      {activeTab === 'analysis' && (
        <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
          {/* Primary Evidence Visual Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            <div className="w-full h-48 md:h-full rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
              <img
                src={beforeImageUrl}
                alt="Primary reported evidence"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Initial Photographic Observation
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {primaryEvidence?.reporterLabel}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-mono">
                "{primaryEvidence?.description}"
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex flex-wrap gap-3">
                <span>Model: <strong className="text-sky-400">{ai?.modelUsed || apiConfig.selectedModel}</strong></span>
                <span>Confidence: <strong className="text-emerald-400">{((ai?.confidenceScore || 0.9) * 100).toFixed(0)}%</strong></span>
                <span>Severity: <strong className="text-rose-400">{ai?.severity || civicCase.severity}</strong></span>
              </div>
            </div>
          </div>

          {/* TWO DISTINCT EPISTEMIC SECTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. What the AI can infer */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-sky-400 font-mono text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                What the AI Can Infer (Visual Observations)
              </div>

              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-1">
                  Detected Physical Hazards
                </span>
                <div className="space-y-1.5">
                  {ai?.detectedHazards.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-1">
                  Accessibility & Mobility Impact
                </span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {ai?.accessibilityImpact}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-1">
                  Urgency & Recommended Containment
                </span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {ai?.recommendedAction}
                </p>
              </div>
            </div>

            {/* 2. What still needs confirmation */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                What Still Needs Confirmation (Epistemic Uncertainty)
              </div>

              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-1">
                  Visual Limitations & Unverified Assumptions
                </span>
                <div className="space-y-1.5">
                  {ai?.uncertaintyFlags.map((u, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-200/90 bg-amber-950/20 p-2 rounded border border-amber-500/20">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <span>{u}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clarification Questions Input */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-mono text-slate-400 block">
                  Interactive Clarification Prompts (Answers update dossier)
                </span>

                {ai?.clarifyingQuestions.map((q, idx) => {
                  const qId = `q-${idx}`;
                  const existingAnswer = civicCase.clarificationAnswers.find(
                    a => a.questionId === qId || a.question === q
                  );

                  return (
                    <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                      <div className="text-xs font-semibold text-slate-200 flex items-start gap-1.5">
                        <span className="text-sky-400 font-mono font-bold">Q{idx + 1}:</span>
                        <span>{q}</span>
                      </div>

                      {existingAnswer ? (
                        <div className="bg-emerald-950/30 border border-emerald-500/30 p-2 rounded text-xs text-emerald-300 flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold">Answer: </span>
                            {existingAnswer.answer}
                            <div className="text-[10px] text-emerald-400/80 font-mono mt-0.5">
                              Recorded by {existingAnswer.answeredBy} • {new Date(existingAnswer.answeredAt).toLocaleTimeString()}
                            </div>
                          </div>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newAnswers[qId] || ''}
                            onChange={e =>
                              setNewAnswers(prev => ({ ...prev, [qId]: e.target.value }))
                            }
                            placeholder="Type human on-site clarification..."
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveAnswer(q, qId)}
                            disabled={!newAnswers[qId]?.trim()}
                            className="px-3 py-1 rounded bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 text-xs font-mono font-bold transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Evidence Gallery & Duplicate Merge History */}
      {activeTab === 'evidence' && (
        <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
          {/* Duplicate Clustering Summary */}
          {civicCase.mergeHistory.length > 0 && (
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-300 uppercase tracking-wider">
                <GitMerge className="w-4 h-4" />
                Duplicate Evidence Convergence Log ({civicCase.mergeHistory.length} Merges)
              </div>
              <div className="space-y-2">
                {civicCase.mergeHistory.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 rounded-lg border border-purple-500/20 text-xs font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between text-purple-300 font-bold">
                      <span>Report {m.mergedReportId} • {m.reporterLabel}</span>
                      <span className="text-emerald-400">{m.duplicateScore}% Match</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Breakdown: Zone ({m.scoreBreakdown.zoneScore}pts) • Category ({m.scoreBreakdown.categoryScore}pts) • Keyword Overlap ({m.scoreBreakdown.keywordScore}pts)
                    </div>
                    <div className="text-slate-300 text-[11px] font-sans">
                      {m.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence Photos Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Corroborating Photographic Submissions ({civicCase.evidence.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {civicCase.evidence.map((ev, idx) => (
                <div
                  key={ev.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between"
                >
                  <div className="w-full h-56 bg-slate-950 overflow-hidden relative">
                    <img
                      src={ev.imageUrl}
                      alt={`Evidence ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-sky-400 font-mono text-[10px] font-bold">
                      EVIDENCE #{idx + 1}
                    </div>
                    {ev.isPrimary && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-amber-500/90 text-slate-950 font-mono text-[10px] font-bold">
                        ORIGINAL REPORT
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="font-bold text-slate-200">{ev.reporterLabel}</span>
                      <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">
                      "{ev.description}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Actionable Maintenance Dossier */}
      {activeTab === 'dossier' && (
        <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
          <div className="bg-white text-slate-900 rounded-xl p-6 sm:p-8 shadow-2xl space-y-6 dossier-print-container font-sans">
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-mono font-bold tracking-widest text-slate-600 uppercase">
                  MUNICIPAL &amp; CAMPUS FACILITIES WORK ORDER
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                  {civicCase.title}
                </h2>
                <div className="text-xs font-mono text-slate-600 mt-1">
                  Master Case ID: <strong className="text-slate-900">{civicCase.id}</strong> • Priority Score: <strong>{civicCase.priorityScore}/100</strong>
                </div>
              </div>

              <div className="text-right font-mono text-xs text-slate-600">
                <div>Documented: {new Date(civicCase.updatedAt).toLocaleDateString()}</div>
                <div className="font-bold text-red-600 uppercase mt-0.5">
                  Severity: {civicCase.severity}
                </div>
              </div>
            </div>

            {/* Spec Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100 p-3.5 rounded-lg text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Category</span>
                <strong className="text-slate-900">{civicCase.category}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Campus Zone</span>
                <strong className="text-slate-900">{civicCase.zone}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Assigned Unit</span>
                <strong className="text-slate-900">{civicCase.assignedTeam}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Target Response</span>
                <strong className="text-slate-900">{civicCase.estimatedResponseTarget}</strong>
              </div>
            </div>

            {/* Consolidated Evidence */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-700 border-b border-slate-300 pb-1">
                1. Consolidated Incident Evidence ({civicCase.evidence.length} Corroborating Submissions)
              </h4>
              <div className="space-y-2">
                {civicCase.evidence.map((ev, i) => (
                  <div key={i} className="text-xs leading-relaxed border-l-2 border-slate-400 pl-3">
                    <strong className="font-mono text-slate-900">
                      Report {ev.reportId} ({ev.reporterLabel}) — {new Date(ev.timestamp).toLocaleTimeString()}:
                    </strong>
                    <p className="text-slate-700 mt-0.5">{ev.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommendations */}
            {ai && (
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-700 border-b border-slate-300 pb-1">
                  2. AI Safety Assessment (Gemma / Gemini Inspection Engine)
                </h4>
                <div className="text-xs space-y-2 text-slate-800">
                  <p><strong>Accessibility Impact:</strong> {ai.accessibilityImpact}</p>
                  <p><strong>Immediate Containment:</strong> {ai.recommendedAction}</p>
                  <div>
                    <strong>Hazards Flagged:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      {ai.detectedHazards.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Human Clarifications */}
            {civicCase.clarificationAnswers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-700 border-b border-slate-300 pb-1">
                  3. Recorded On-Site Human Clarifications
                </h4>
                {civicCase.clarificationAnswers.map((a, i) => (
                  <div key={i} className="text-xs bg-slate-50 p-2 rounded border border-slate-200">
                    <div className="italic text-slate-600">Q: {a.question}</div>
                    <div className="font-bold text-slate-900 mt-0.5">A: {a.answer} ({a.answeredBy})</div>
                  </div>
                ))}
              </div>
            )}

            {/* Print Footer */}
            <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>REPAIR.AI Civic Operations Intelligence</span>
              <span>Visual SLA Estimate — Non-binding Dispatch Guarantee</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Visual Repair Verification */}
      {activeTab === 'verification' && (
        <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
          {/* Top Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Visual Repair Verification & Comparison
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Stage 5: Multimodal Reality Inspection
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* After-image upload control */}
              <label className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-sky-400" />
                <span>Upload After-Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          setAfterImageUrl(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => setAfterImageUrl(repairedRampSvg)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700"
                title="Reset to bundled repaired ramp preset"
              >
                Reset Preset
              </button>

              {/* View mode toggle */}
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setViewMode('slider')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    viewMode === 'slider'
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Split Slider
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('side-by-side')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    viewMode === 'side-by-side'
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Side by Side
                </button>
              </div>

              {/* Run Verification Button */}
              <button
                type="button"
                onClick={handleRunVerification}
                disabled={isVerifying}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-bold transition-colors shadow-md shadow-emerald-500/20"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                {isVerifying ? 'Comparing Evidence...' : 'Run Multimodal Verification'}
              </button>
            </div>
          </div>

          {/* Verification Comparison Display */}
          {viewMode === 'slider' ? (
            <ImageComparisonSlider
              beforeUrl={beforeImageUrl}
              afterUrl={afterImageUrl}
              beforeLabel="BEFORE REPAIR (Incident Evidence)"
              afterLabel="AFTER REPAIR (Contractor Evidence)"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="text-xs font-mono font-bold text-rose-400 uppercase">
                  Before Repair (Reported Defect)
                </div>
                <div className="w-full h-72 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                  <img
                    src={beforeImageUrl}
                    alt="Before condition"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  After Repair (Completed Work)
                </div>
                <div className="w-full h-72 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                  <img
                    src={afterImageUrl}
                    alt="After condition"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          )}

          {/* AI Verification Results Card */}
          {civicCase.verification ? (
            <div className="bg-slate-900/60 border border-emerald-500/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      Verification Status: <span className="text-emerald-400">{civicCase.verification.verificationStatus}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Visual Comparison Confidence: {(civicCase.verification.confidenceScore * 100).toFixed(0)}% • {civicCase.verification.isSimulated ? 'Simulated Inspection' : 'Live Gemini Inspection'}
                    </div>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  VISUALLY VERIFIED
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
                  Observed Visual Differences
                </span>
                <div className="space-y-1">
                  {civicCase.verification.visualChangesObserved.map((change, i) => (
                    <div key={i} className="text-xs text-slate-200 flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{change}</span>
                    </div>
                  ))}
                </div>
              </div>

              {civicCase.verification.remainingConcerns.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">
                    Remaining Operational Cautions
                  </span>
                  <div className="space-y-1">
                    {civicCase.verification.remainingConcerns.map((concern, i) => (
                      <div key={i} className="text-xs text-amber-200/90 flex items-start gap-2 bg-amber-950/20 p-2 rounded border border-amber-500/20">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{concern}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STATUTORY DISCLAIMER */}
              <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
                <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mb-1" />
                {civicCase.verification.complianceDisclaimer}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 mx-auto text-slate-600" />
              <div className="text-xs font-mono text-slate-300 font-bold">
                No Visual Verification Recorded Yet
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click "Run Multimodal Verification" to compare the reported incident against the contractor repair submission.
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
};
