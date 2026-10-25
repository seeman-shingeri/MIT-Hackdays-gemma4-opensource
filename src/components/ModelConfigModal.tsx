import React, { useState } from 'react';
import { 
  Key, 
  Cpu, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ExternalLink, 
  Sparkles,
  Info
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

  if (!isOpen) return null;

  const handleTestKey = async () => {
    setIsTesting(true);
    setCheckResult(null);
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

  const handleSaveAndClose = () => {
    onSaveApiKey(inputKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#111827] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                AI Engine & Model Configuration
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Google Gemini API • Gemma 4 Track • Civic Inspector
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

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Operating Mode Selector */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <label className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider block mb-3">
              Execution Environment
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onToggleDemoMode(true)}
                className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all ${
                  isDemoMode
                    ? 'border-sky-500 bg-sky-950/30 text-sky-100'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Sparkles className={`w-5 h-5 mt-0.5 shrink-0 ${isDemoMode ? 'text-sky-400' : 'text-slate-500'}`} />
                <div>
                  <div className="font-semibold text-sm text-slate-200">
                    Offline Demo Simulator
                  </div>
                  <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                    100% reliable offline mode for five-minute hackathon jury presentations. No API key required.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onToggleDemoMode(false)}
                className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all ${
                  !isDemoMode
                    ? 'border-emerald-500 bg-emerald-950/30 text-emerald-100'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Key className={`w-5 h-5 mt-0.5 shrink-0 ${!isDemoMode ? 'text-emerald-400' : 'text-slate-500'}`} />
                <div>
                  <div className="font-semibold text-sm text-slate-200">
                    Live Google Gemini API
                  </div>
                  <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Direct browser fetch to Google Generative Language REST endpoints using your API key.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* API Key Input Section (Enabled if Live mode is active or user wants to configure) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-mono"
              >
                Get API Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 font-mono placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTesting || !inputKey.trim()}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-mono font-semibold border border-slate-700 transition-colors"
              >
                {isTesting ? 'Testing...' : 'Test & Detect'}
              </button>
            </div>

            {/* Security Warning Notice */}
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5 leading-relaxed">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <strong>Security Architecture Notice:</strong> For this hackathon client-side application, API keys are stored solely in <code className="font-mono bg-black/40 px-1 py-0.5 rounded">sessionStorage</code> and cleared when the browser tab closes. Never commit keys to Git or use production credentials in client-side prototypes.
              </div>
            </div>

            {/* Test Results Banner */}
            {checkResult && (
              <div
                className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                  checkResult.valid
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {checkResult.valid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      API Key Verified! {checkResult.availableModels.length} models accessible.
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      API Verification Failed
                    </>
                  )}
                </div>
                {checkResult.errorMessage && <p>{checkResult.errorMessage}</p>}
                {checkResult.warningMessage && (
                  <p className="mt-1 text-amber-300 flex items-start gap-1">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {checkResult.warningMessage}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Model Selection Radios */}
          <div className="space-y-3">
            <label className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider block">
              Active Multimodal Model
            </label>
            <div className="space-y-2.5">
              {SUPPORTED_MODELS.map(model => {
                const isSelected = selectedModel === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => onSelectModel(model.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-950/20'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="selectedModel"
                          checked={isSelected}
                          onChange={() => onSelectModel(model.id)}
                          className="accent-sky-500"
                        />
                        <span className="font-bold text-sm text-slate-200">
                          {model.name}
                        </span>
                        {model.isGemma4 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            ★ HACKATHON TARGET
                          </span>
                        )}
                        {model.isFallback && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                            FALLBACK
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {model.provider}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 pl-5 leading-relaxed">
                      {model.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <div className="text-xs font-mono text-slate-400">
            Selected: <span className="text-sky-400 font-bold">{selectedModel}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-5 py-2 rounded-lg text-xs font-mono font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors shadow-lg shadow-sky-500/20"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
