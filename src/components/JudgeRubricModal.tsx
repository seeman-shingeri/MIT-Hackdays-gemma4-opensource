import React from 'react';
import { 
  X, 
  Award, 
  Layers, 
  GitMerge, 
  ShieldCheck, 
  Activity, 
  Code2, 
  BookOpen,
  Cpu
} from 'lucide-react';
import type { CivicCase } from '../types/case';

interface JudgeRubricModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: CivicCase[];
  selectedModel: string;
  isDemoMode: boolean;
  aiCallsCount: number;
}

export const JudgeRubricModal: React.FC<JudgeRubricModalProps> = ({
  isOpen,
  onClose,
  cases,
  selectedModel,
  isDemoMode,
  aiCallsCount,
}) => {
  if (!isOpen) return null;

  // Real, computed metrics from live application state
  const totalCases = cases.length;
  const openCases = cases.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
  const mergedReports = cases.reduce((acc, c) => acc + c.mergeHistory.length, 0);
  const totalEvidenceItems = cases.reduce((acc, c) => acc + c.evidence.length, 0);
  const visuallyVerifiedCases = cases.filter(
    c => c.verification && c.verification.verificationStatus === 'VISUALLY_VERIFIED'
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Evaluation Rubric &amp; System Architecture
              </h2>
              <p className="text-xs text-slate-500">
                Best Open-Source AI Project • Best Use of Gemma 4 • Hacktoberfest × MOSS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Live Application Telemetry Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                <Activity className="w-4 h-4 text-emerald-600" />
                Live Application Telemetry (Measured in Active Session)
              </div>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Live State
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                <div className="text-2xl font-bold text-slate-900">{totalCases}</div>
                <div className="text-xs text-slate-500 mt-0.5">Total Cases</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                <div className="text-2xl font-bold text-amber-600">{openCases}</div>
                <div className="text-xs text-slate-500 mt-0.5">Active / Open</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                <div className="text-2xl font-bold text-blue-600">{totalEvidenceItems}</div>
                <div className="text-xs text-slate-500 mt-0.5">Evidence Photos</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                <div className="text-2xl font-bold text-purple-600">{mergedReports}</div>
                <div className="text-xs text-slate-500 mt-0.5">Duplicates Merged</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                <div className="text-2xl font-bold text-emerald-600">{visuallyVerifiedCases}</div>
                <div className="text-xs text-slate-500 mt-0.5">Repairs Verified</div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
              <div>
                Active Model: <strong className="text-slate-900">{selectedModel}</strong> ({isDemoMode ? 'Offline Simulator' : 'Live Gemini REST API'})
              </div>
              <div>
                AI Inferences Executed: <strong className="text-slate-900">{aiCallsCount}</strong>
              </div>
            </div>
          </div>

          {/* Section 1: Problem Statement */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              1. Problem Statement &amp; Civic Value
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              Municipal maintenance and university campus facilities receive hundreds of unstructured, duplicate citizen reports for hazards like broken ramps, exposed wiring, and blocked pedestrian pathways. <strong>REPAIR.AI</strong> structures reality capture into triage data, handles epistemic uncertainty, calculates deterministic duplicate clustering, generates facilities work orders, and provides visual repair verification.
            </p>
          </div>

          {/* Section 2: Five-Stage Architecture */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-700" />
              2. Five-Stage Inspection Architecture
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-semibold text-blue-700 text-[11px] block">Stage 1</span>
                <strong className="text-slate-900 block">Reality Capture</strong>
                <p className="text-slate-500 text-[11px] leading-snug">
                  Photograph ingestion, presets, GPS zone mapping, and camera validation.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-semibold text-blue-700 text-[11px] block">Stage 2</span>
                <strong className="text-slate-900 block">Gemma Multimodal</strong>
                <p className="text-slate-500 text-[11px] leading-snug">
                  Structured JSON extraction, severity rating, and epistemic uncertainty division.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-semibold text-blue-700 text-[11px] block">Stage 3</span>
                <strong className="text-slate-900 block">Duplicate Clustering</strong>
                <p className="text-slate-500 text-[11px] leading-snug">
                  Deterministic score: Zone (40%) + Category (35%) + Keyword Jaccard (25%).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-semibold text-blue-700 text-[11px] block">Stage 4</span>
                <strong className="text-slate-900 block">Work Order Dossier</strong>
                <p className="text-slate-500 text-[11px] leading-snug">
                  Consolidated evidence, SLA targets, Markdown copying, and print-to-PDF.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-semibold text-blue-700 text-[11px] block">Stage 5</span>
                <strong className="text-slate-900 block">Visual Verification</strong>
                <p className="text-slate-500 text-[11px] leading-snug">
                  Interactive split slider + multimodal difference inspection + statutory sign-off.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Gemma 4 Track Alignment */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-600" />
              3. Gemma 4 Open-Weights Integration
            </h3>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <p>
                <strong>Requested Model:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800 font-mono">gemma-4-27b-it</code> via the Google Generative Language API endpoint.
              </p>
              <p>
                <strong>No Silent Substitution Policy:</strong> If the user's API key tier does not have Gemma 4 provisioned, a clear configuration notice is shown with explicit fallback options to <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800 font-mono">gemma-3-27b-it</code> or <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800 font-mono">gemini-2.5-flash</code>.
              </p>
            </div>
          </div>

          {/* Section 4: Explainable Duplicate Matching Formula */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-blue-600" />
              4. Deterministic Duplicate Matching Formula
            </h3>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2 leading-relaxed">
              <div className="font-mono text-blue-800 font-semibold bg-white p-2 rounded-lg border border-slate-200">
                Score = Zone_Match(40) + Category_Match(35) + Keyword_Overlap(25)
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li><strong>Zone Match (40 pts):</strong> Exact campus zone equality.</li>
                <li><strong>Category Match (35 pts):</strong> Exact hazard category match.</li>
                <li><strong>Keyword Overlap (25 pts):</strong> Normalized token intersection across title, description, and landmarks.</li>
                <li><strong>Actionable Threshold:</strong> Score &ge; 70% enables 1-click evidence merging without duplicate ticket creation.</li>
              </ul>
            </div>
          </div>

          {/* Section 5: Verification Limitations & Statutory Disclaimer */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              5. Statutory Verification Limitations
            </h3>
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 leading-relaxed">
              <strong>STATUTORY NOTICE:</strong> Visual repair verification confirms 2D surface differences only. It does NOT certify structural strength, load-bearing safety, or building code compliance. A licensed municipal or university safety engineer must conduct on-site physical certification before final reopening.
            </div>
          </div>

          {/* Section 6: Open Source Attribution */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-slate-500" />
              6. Open Source Licensing &amp; Dependencies
            </h3>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div><strong>License:</strong> MIT License (Open Source, OSI-Approved)</div>
              <div><strong>Stack:</strong> React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Vitest, Happy-DOM</div>
              <div><strong>Repository:</strong> https://github.com/seeman-shingeri/MIT-Hackdays-gemma4-opensource</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <span className="text-xs text-slate-500">
            REPAIR.AI — Hacktoberfest × MOSS Hack Day
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Close Rubric
          </button>
        </div>
      </div>
    </div>
  );
};
