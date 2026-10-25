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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                AI Engine &amp; API Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Gemma 4 • Google Gemini API Engine
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

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Operating Mode Selector */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2.5">
              Operating Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onToggleDemoMode(true)}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                  isDemoMode
                    ? 'border-blue-600 bg-white shadow-xs ring-1 ring-blue-600/30'
                    : 'border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${isDemoMode ? 'text-blue-600' : 'text-slate-400'}`} />
                <div>
                  <div className="font-semibold text-xs text-slate-900">
                    Offline Demo Simulator
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    100% offline demonstration mode. No API key required.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onToggleDemoMode(false)}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                  !isDemoMode
                    ? 'border-emerald-600 bg-white shadow-xs ring-1 ring-emerald-600/30'
                    : 'border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Key className={`w-4 h-4 mt-0.5 shrink-0 ${!isDemoMode ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="font-semibold text-xs text-slate-900">
                    Live Gemini API
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Live multimodal inference via Google Generative Language REST API.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* API Key Input Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
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
                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTesting || !inputKey.trim()}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 text-xs font-medium border border-slate-300 transition-colors"
              >
                {isTesting ? 'Verifying...' : 'Test & Detect'}
              </button>
            </div>

            {/* Security Warning Notice */}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 leading-relaxed">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <strong>Security Architecture:</strong> API keys are kept strictly in browser <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">sessionStorage</code> and cleared when the browser tab closes. Keys are never saved to LocalStorage or committed to Git.
              </div>
            </div>

            {/* Test Results Banner */}
            {checkResult && (
              <div
                className={`p-3 rounded-lg border text-xs leading-relaxed ${
                  checkResult.valid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold mb-1">
                  {checkResult.valid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Key verified! {checkResult.availableModels.length} models accessible.
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Verification Failed
                    </>
                  )}
                </div>
                {checkResult.errorMessage && <p>{checkResult.errorMessage}</p>}
                {checkResult.warningMessage && (
                  <p className="mt-1 text-amber-800 flex items-start gap-1">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                    {checkResult.warningMessage}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Configured Model
            </label>
            <div className="space-y-2">
              {SUPPORTED_MODELS.map(model => {
                const isSelected = selectedModel === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => onSelectModel(model.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-1 ring-blue-600/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="selectedModel"
                          checked={isSelected}
                          onChange={() => onSelectModel(model.id)}
                          className="accent-blue-600"
                        />
                        <span className="font-semibold text-xs text-slate-900">
                          {model.name}
                        </span>
                        {model.isGemma4 && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            Hackathon Target
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {model.provider}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 pl-5">
                      {model.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-500">
            Current: <span className="text-blue-600 font-semibold">{selectedModel}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
