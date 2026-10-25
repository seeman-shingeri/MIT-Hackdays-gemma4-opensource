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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#111827] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Hackathon Jury Rubric & Technical Architecture
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Best Open-Source AI Project • Best Use of Gemma 4 • Hacktoberfest × MOSS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Live Application Telemetry Banner */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                <Activity className="w-4 h-4 text-emerald-400" />
                Live Application Metrics (Measured in Current Session)
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                REAL RUNTIME METRICS
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-2xl font-mono font-bold text-slate-100">{totalCases}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">Master Cases</div>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-2xl font-mono font-bold text-amber-400">{openCases}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">Active / Open</div>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-2xl font-mono font-bold text-sky-400">{totalEvidenceItems}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">Evidence Photos</div>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-2xl font-mono font-bold text-purple-400">{mergedReports}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">Duplicates Merged</div>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-2xl font-mono font-bold text-emerald-400">{visuallyVerifiedCases}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">Repairs Verified</div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
              <div>
                Active Model: <span className="text-sky-300 font-bold">{selectedModel}</span> ({isDemoMode ? 'Offline Simulator' : 'Live Gemini REST API'})
              </div>
              <div>
                Inferences Executed This Session: <span className="text-amber-300 font-bold">{aiCallsCount}</span>
              </div>
            </div>
          </div>

          {/* Section 1: Problem & Purpose */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-400" />
              1. Problem Statement & Civic Mission
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3.5 rounded-lg border border-slate-800">
              Campus and municipal facilities struggle with fragmented, duplicate citizen hazard reports. A broken wheelchair ramp or exposed conduit might be reported 5 times with varying photos and subjective descriptions, overwhelming dispatcher queues. <strong>REPAIR.AI</strong> automates reality capture, extracts structured hazards with epistemic uncertainty flags, calculates deterministic duplicate clustering, outputs copy-ready maintenance work orders, and performs multimodal before/after visual verification.
            </p>
          </div>

          {/* Section 2: Five-Stage Architecture */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              2. Five-Stage Civic Infrastructure Architecture
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono text-sky-400 font-bold">STAGE 1</div>
                  <div className="text-xs font-bold text-slate-200 mt-1">Capture Reality</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Photo upload, local SVG presets, zone mapping, and metadata capture.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono text-amber-400 font-bold">STAGE 2</div>
                  <div className="text-xs font-bold text-slate-200 mt-1">Gemma Multimodal</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Structured JSON extraction, severity rating, and epistemic uncertainty questions.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono text-purple-400 font-bold">STAGE 3</div>
                  <div className="text-xs font-bold text-slate-200 mt-1">Duplicate Clustering</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Deterministic 0-100 score: Zone (40%) + Category (35%) + Keywords (25%).
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono text-emerald-400 font-bold">STAGE 4</div>
                  <div className="text-xs font-bold text-slate-200 mt-1">Actionable Dossier</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Consolidated evidence, Markdown clipboard copy, and browser print-to-PDF.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono text-rose-400 font-bold">STAGE 5</div>
                  <div className="text-xs font-bold text-slate-200 mt-1">Visual Verification</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Interactive before/after slider + multimodal difference inspection.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Gemma 4 Integration & Track Details */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              3. Gemma 4 Integration & Open-Weights Engineering
            </h3>
            <div className="bg-slate-900/40 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                <strong>Requested Default Model:</strong> <code className="font-mono text-amber-300">gemma-4-27b-it</code> via Google Gemini REST API endpoints (<code className="font-mono text-slate-400">/v1beta/models/gemma-4-27b-it:generateContent</code>).
              </p>
              <p>
                <strong>Model Capability & Fallback Policy:</strong> The application does not silently substitute models. If the user’s API key does not have Gemma 4 provisioned in its quota tier, a clear configuration warning is presented, allowing explicit fallback to <code className="font-mono text-sky-300">gemma-3-27b-it</code> or <code className="font-mono text-slate-300">gemini-2.5-flash</code>, or running the deterministic offline simulator.
              </p>
            </div>
          </div>

          {/* Section 4: Explainable Duplicate Matching Formula */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-sky-400" />
              4. Deterministic Duplicate Matching Formula
            </h3>
            <div className="bg-slate-900/40 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed font-mono">
              <div className="text-sky-300 font-bold text-sm">
                Duplicate_Score = Zone_Score(40) + Category_Score(35) + Keyword_Overlap(25)
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-200">Zone Match (40 pts):</strong> Exact campus zone equality (<code className="text-amber-300">report.zone === case.zone</code>).</li>
                <li><strong className="text-slate-200">Category Match (35 pts):</strong> Exact civic hazard category match (<code className="text-amber-300">report.category === case.category</code>).</li>
                <li><strong className="text-slate-200">Keyword Overlap (25 pts):</strong> Normalized token intersection (removing stop-words) across report description, landmark, and title.</li>
                <li><strong className="text-slate-200">Threshold:</strong> Any score <span className="text-emerald-400 font-bold">&ge; 70%</span> triggers the Probable Duplicate warning and enables 1-click evidence merging.</li>
              </ul>
            </div>
          </div>

          {/* Section 5: Verification Limitations & Disclaimer */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              5. Visual Verification Limitations & Statutory Disclaimer
            </h3>
            <div className="bg-rose-950/20 border border-rose-500/30 p-3.5 rounded-lg text-xs text-rose-200 leading-relaxed">
              <strong>STATUTORY CIVIC SAFETY NOTICE:</strong> Visual verification confirms only that surface changes have occurred based on 2D imagery. It does NOT certify structural strength, load-bearing safety, electrical code conformance, or legal ADA Title III compliance. The application explicitly preserves review states and displays this notice across all dossiers and exports.
            </div>
          </div>

          {/* Section 6: Open Source & Stack Attribution */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-slate-400" />
              6. Open-Source Licensing & Stack Attribution
            </h3>
            <div className="bg-slate-900/40 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1.5 leading-relaxed font-mono">
              <div><strong>License:</strong> MIT License (Open Source, OSI-Approved)</div>
              <div><strong>Repository:</strong> seeman-shingeri/MIT-Hackdays-gemma4-opensource</div>
              <div><strong>Core Stack:</strong> React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Vitest, Happy-DOM</div>
              <div><strong>Zero Heavy Dependencies:</strong> Zero heavyweight PDF libraries; native browser printing and CSS paged media used for clean dossier export.</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <div className="text-xs font-mono text-slate-400">
            REPAIR.AI — Hacktoberfest × MOSS Hack Day
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors"
          >
            Close Rubric
          </button>
        </div>
      </div>
    </div>
  );
};
