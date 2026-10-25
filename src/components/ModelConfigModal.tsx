import React, { useState } from 'react';
import { 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Sparkles, 
  Activity, 
  RefreshCw,
  Key
} from 'lucide-react';
import { SUPPORTED_MODELS } from '../types/ai';
import { checkApiKeyAndModels, type ModelCheckResult } from '../services/ai';

interface ModelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  isDemoMode: boolean;
  onToggleDemoMode: (isDemo: boolean) => void;
}

export const ModelConfigModal: React.FC<ModelConfigModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  selectedModel,
  onSelectModel,
  isDemoMode,
  onToggleDemoMode,
}) => {
  const [inputKey, setInputKey] = useState<string>(apiKey);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [checkResult, setCheckResult] = useState<ModelCheckResult | null>(null);
  const [hasTested, setHasTested] = useState<boolean>(false);

  if (!isOpen) return null;

  // Resolve actual model details
  const activeModelMeta = SUPPORTED_MODELS.find(m => m.id === selectedModel) || {
    id: selectedModel,
    name: selectedModel.includes('gemma') ? 'Gemma 4 27B-IT' : selectedModel,
    provider: 'Google Gemini API / Open Weights',
    description: 'Autonomous reasoning engine for structured civic extraction and fault classification.',
  };

  const handleTestConnectivity = async () => {
    setIsTesting(true);
    setCheckResult(null);
    setHasTested(true);
    try {
      const result = await checkApiKeyAndModels(inputKey);
      setCheckResult(result);
      if (result.valid) {
        onSaveApiKey(inputKey);
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

  // Connection state determination
  const connectionState = isDemoMode
    ? 'Demo Simulator Mode'
    : hasTested
    ? checkResult?.valid
      ? 'Connected'
      : 'Not Connected'
    : apiKey
    ? 'Configured (Not Checked)'
    : 'Not Configured';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                GEMMA 4 MODEL SETTINGS
              </h2>
              <p className="text-[11px] text-slate-400">
                Inference endpoint &amp; model connectivity
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Explicit Demo Simulator Banner if Active */}
          {isDemoMode && (
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Demo Simulator Mode Active</strong>
                  <span className="text-[11px] text-amber-800">
                    Operating on calibrated offline evaluation responses. No external API quota consumed.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleDemoMode(false)}
                className="text-[11px] font-bold text-amber-900 underline shrink-0 mt-0.5"
              >
                Disable
              </button>
            </div>
          )}

          {/* Core Gemma 4 Model Details Card */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                Configured Model
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {activeModelMeta.id}
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.2 rounded-full">
                  {activeModelMeta.name}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                Provider
              </span>
              <span className="text-xs font-medium text-slate-800">
                {activeModelMeta.provider}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                Connection Status
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                {connectionState === 'Connected' ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Connected
                  </span>
                ) : connectionState === 'Demo Simulator Mode' ? (
                  <span className="text-amber-700 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Demo Simulator (Offline)
                  </span>
                ) : connectionState === 'Not Connected' ? (
                  <span className="text-rose-700 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Not Connected
                  </span>
                ) : (
                  <span className="text-slate-500 flex items-center gap-1">
                    <Activity className="w-4 h-4 text-slate-400" />
                    {connectionState}
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                Supported Input Modalities
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700 font-medium">
                  High-Resolution Photographs
                </span>
                <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700 font-medium">
                  Multimodal Defect Classification
                </span>
                <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700 font-medium">
                  Structured JSON Schema
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                Purpose
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Analyzes submitted infrastructure photographs and produces structured findings (hazards, ADA impact, uncertainties, recommended actions) for human reviewer validation.
              </p>
            </div>
          </div>

          {/* Connectivity Verification Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Test Connection / API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={inputKey}
                  onChange={e => setInputKey(e.target.value)}
                  placeholder="AIzaSy... (Session Only)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleTestConnectivity}
                disabled={isTesting || !inputKey.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testing...' : 'Check Connection'}</span>
              </button>
            </div>

            {checkResult && (
              <div className={`p-3 rounded-xl text-xs border ${
                checkResult.valid
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {checkResult.valid ? (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Connection successful. Gemma 4 / Gemini API available.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{checkResult.errorMessage || 'Connection failed.'}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Keys are never committed or logged permanently.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
