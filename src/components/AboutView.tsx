import React, { useState } from 'react';
import { 
  Cpu, 
  Key, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Trash2, 
  ShieldCheck, 
  Code2, 
  Activity,
  AlertOctagon
} from 'lucide-react';
import { SUPPORTED_MODELS } from '../types/ai';
import { checkApiKeyAndModels, type ModelCheckResult } from '../services/ai';
import type { CivicCase } from '../types/case';

interface AboutViewProps {
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  isDemoMode: boolean;
  onToggleDemoMode: (isDemo: boolean) => void;
  onStartReplay: () => void;
  cases: CivicCase[];
  onClearData: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({
  apiKey,
  onSaveApiKey,
  selectedModel,
  onSelectModel,
  isDemoMode,
  onToggleDemoMode,
  onStartReplay,
  cases,
  onClearData,
}) => {
  const [inputKey, setInputKey] = useState<string>(apiKey);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [checkResult, setCheckResult] = useState<ModelCheckResult | null>(null);
  const [saveToast, setSaveToast] = useState<boolean>(false);

  // Live session statistics
  const totalCases = cases.length;
  const openCases = cases.filter(c => c.status !== 'RESOLVED').length;
  const totalEvidence = cases.reduce((acc, c) => acc + c.evidence.length, 0);
  const mergedDuplicates = cases.reduce((acc, c) => acc + c.mergeHistory.length, 0);

  const handleTestAndSaveKey = async () => {
    setIsTesting(true);
    setCheckResult(null);
    try {
      const result = await checkApiKeyAndModels(inputKey);
      setCheckResult(result);
      if (result.valid) {
        onSaveApiKey(inputKey);
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 2500);
        if (result.hasGemma4) {
          onSelectModel('gemma-4-27b-it');
        } else if (result.recommendedModel) {
          onSelectModel(result.recommendedModel);
        }
      }
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto overscroll-y-contain bg-slate-50 min-h-full">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md text-white text-xs font-medium shadow-lg flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>API Key validated and active for this browser session</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* 1. Header Card (Apple Crystal Glass) */}
        <div className="backdrop-blur-xl bg-white/80 border border-slate-200/70 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                REPAIR<span className="text-blue-600">.AI</span>
              </h1>
              <p className="text-xs text-slate-500">
                Civic Infrastructure Intelligence &amp; Autonomous Fault Recognition
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
            A production-grade civic tech platform built for community members, university maintenance teams, and accessibility auditors. 
            Powered by Gemma and Google Gemini multimodal models to identify real infrastructure faults, cluster duplicate reports, and verify repairs without fake data.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <a
              href="https://github.com/seeman-shingeri/MIT-Hackdays-gemma4-opensource"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>GitHub Repository</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/60">
              Best Open-Source AI Project
            </span>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50/80 px-2.5 py-1 rounded-lg border border-purple-200/60">
              Best Use of Gemma 4
            </span>
          </div>
        </div>

        {/* 2. AI Engine & API Configuration */}
        <div className="backdrop-blur-xl bg-white/80 border border-slate-200/70 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  AI Engine Configuration
                </h2>
                <p className="text-[11px] text-slate-400">
                  Google Gemini &amp; Gemma API credentials
                </p>
              </div>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60">
              {apiKey ? 'Key Configured' : 'No Key (Demo Mode Ready)'}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Google Gemini API Key
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={inputKey}
                    onChange={e => setInputKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono shadow-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTestAndSaveKey}
                  disabled={isTesting || !inputKey.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 shrink-0"
                >
                  {isTesting ? 'Verifying...' : 'Save & Test Key'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Saved only in ephemeral session storage. Never committed to Git or sent to third parties.</span>
              </p>
            </div>

            {/* Test Results Output */}
            {checkResult && (
              <div className={`p-4 rounded-xl text-xs border ${
                checkResult.valid 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                  : 'bg-rose-50/70 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center gap-2 font-semibold">
                  {checkResult.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{checkResult.valid ? 'API Key validated successfully' : (checkResult.errorMessage || 'Invalid API key')}</span>
                </div>
                {checkResult.warningMessage && (
                  <p className="mt-1 text-[11px] text-amber-800">
                    {checkResult.warningMessage}
                  </p>
                )}
                {checkResult.recommendedModel && (
                  <p className="mt-1 text-[11px]">
                    Recommended model for multimodal analysis: <strong>{checkResult.recommendedModel}</strong>
                  </p>
                )}
              </div>
            )}

            {/* Model Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                Active Reasoning Model
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SUPPORTED_MODELS.map(model => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => onSelectModel(model.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      selectedModel === model.id
                        ? 'bg-blue-50/70 border-blue-400 shadow-xs ring-1 ring-blue-400/50'
                        : 'bg-white hover:bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{model.name}</span>
                      {selectedModel === model.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block mb-1">{model.id}</span>
                    <span className="text-[11px] text-slate-500 leading-snug block">{model.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Demonstration & Community Problem Replay */}
        <div className="backdrop-blur-xl bg-white/80 border border-slate-200/70 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Demonstration &amp; Replay Controls
                </h2>
                <p className="text-[11px] text-slate-400">
                  Isolated demo dataset and 5-step problem resolution walkthrough
                </p>
              </div>
            </div>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border ${
              isDemoMode ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {isDemoMode ? 'Demo Mode Active' : 'Real User Mode'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-3">
              <h3 className="text-xs font-bold text-slate-900">
                Isolated Demo Dataset
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Switches between your genuine local user reports and an isolated demonstration dataset (Main Library ramp fracture with merged secondary submissions).
              </p>
              <button
                type="button"
                onClick={() => onToggleDemoMode(!isDemoMode)}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  isDemoMode
                    ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                }`}
              >
                {isDemoMode ? 'Exit Demo Mode' : 'Enable Demo Mode'}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-3">
              <h3 className="text-xs font-bold text-slate-900">
                Community Problem Replay
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Interactive 5-stage walkthrough showcasing initial capture, Gemma analysis, duplicate clustering, contractor work order dispatch, and visual repair verification.
              </p>
              <button
                type="button"
                onClick={onStartReplay}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Replay Director</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Local Data & Storage Management */}
        <div className="backdrop-blur-xl bg-white/80 border border-slate-200/70 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Active Session Data
                </h2>
                <p className="text-[11px] text-slate-400">
                  Local browser storage metrics and controls
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70">
              <div className="text-xl font-bold text-slate-900">{totalCases}</div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Reports</div>
            </div>
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70">
              <div className="text-xl font-bold text-amber-600">{openCases}</div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Active Cases</div>
            </div>
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70">
              <div className="text-xl font-bold text-blue-600">{totalEvidence}</div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Evidence Photos</div>
            </div>
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70">
              <div className="text-xl font-bold text-purple-600">{mergedDuplicates}</div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Duplicates Merged</div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClearData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Reset Local Records</span>
            </button>
          </div>
        </div>

        {/* 5. Statutory Engineering Notice */}
        <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200/70 text-xs text-slate-600 flex items-start gap-3 leading-relaxed">
          <AlertOctagon className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <strong>Statutory Compliance &amp; Safety Disclaimer:</strong> REPAIR.AI provides assistive, computer vision-assisted triage and documentation tools for municipal and university staff. Visual verifications and AI fault classifications do not replace mandated on-site structural inspections, building code certifications, or engineering sign-offs.
          </div>
        </div>
      </div>
    </div>
  );
};
