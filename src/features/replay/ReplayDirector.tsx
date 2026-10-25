import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  X, 
  CheckCircle2, 
  Clock, 
  User
} from 'lucide-react';
import { REPLAY_STEPS } from './replaySteps';

interface ReplayDirectorProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  onClose: () => void;
}

export const ReplayDirector: React.FC<ReplayDirectorProps> = ({
  currentStep,
  onStepChange,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const step = REPLAY_STEPS.find(s => s.stepNumber === currentStep) || REPLAY_STEPS[0];

  useEffect(() => {
    if (!isPlaying) return;

    const stepDuration = 8000; // 8 seconds per step
    const interval = 100;
    let elapsed = 0;

    const progressTimer = setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / stepDuration) * 100);
    }, interval);

    const timer = setTimeout(() => {
      if (currentStep < 5) {
        onStepChange(currentStep + 1);
        setProgress(0);
      } else {
        setIsPlaying(false);
        setProgress(100);
      }
    }, stepDuration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, [isPlaying, currentStep, onStepChange]);

  const handlePrev = () => {
    if (currentStep > 1) {
      onStepChange(currentStep - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      onStepChange(currentStep + 1);
      setProgress(0);
    }
  };

  const handleRestart = () => {
    onStepChange(1);
    setProgress(0);
  };

  return (
    <div className="w-full bg-amber-50/60 border-b border-amber-200 shadow-xs relative">
      {/* Top Progress Bar when Playing */}
      {isPlaying && (
        <div
          className="absolute top-0 left-0 h-1 bg-amber-500 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 space-y-3">
        {/* Top Header: Scenario Title & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-200 text-amber-900 border border-amber-300">
              Guided Demonstration Flow
            </span>
            <span className="text-xs text-slate-600 hidden sm:inline font-medium">
              Case CIV-8492-A: Concrete Ramp Degradation &amp; Verification
            </span>
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep <= 1}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              title="Previous Step"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setProgress(0);
                setIsPlaying(!isPlaying);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Auto-Play</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentStep >= 5}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              title="Next Step"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleRestart}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              title="Restart Demonstration"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              title="Exit Demonstration"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timeline Stepper Chips (Usable on mobile without overflow) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
          {REPLAY_STEPS.map(s => {
            const isActive = s.stepNumber === currentStep;
            const isCompleted = s.stepNumber < currentStep;
            return (
              <button
                key={s.stepNumber}
                type="button"
                onClick={() => {
                  onStepChange(s.stepNumber);
                  setProgress(0);
                }}
                className={`p-2 rounded-lg text-left border transition-all ${
                  isActive
                    ? 'border-amber-500 bg-white shadow-xs ring-1 ring-amber-500/30'
                    : isCompleted
                    ? 'border-slate-200 bg-white/70 hover:bg-white'
                    : 'border-slate-200/60 bg-white/40 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-bold ${isActive ? 'text-amber-800' : 'text-slate-600'}`}>
                    Step {s.stepNumber}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="text-[11px] text-slate-400 font-mono">{s.timeLabel}</span>
                  )}
                </div>
                <div className="text-xs text-slate-700 truncate mt-0.5 font-medium">
                  {s.title.split('&')[0]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Narrative & Automated Action Banner */}
        <div className="bg-white rounded-xl border border-amber-200 p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="space-y-1 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                {step.badge.split('•')[1] || step.badge}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {step.timeLabel}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 flex items-center gap-1 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {step.reporter}
              </span>
            </div>
            <p className="text-slate-800 text-xs leading-relaxed font-normal">
              {step.summary}
            </p>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 w-full md:w-auto md:min-w-[320px] space-y-1">
            <span className="font-semibold text-slate-700 block text-[11px]">
              Automated Inspection Pipeline:
            </span>
            {step.technicalHighlights.map((th, i) => (
              <div key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5 leading-snug">
                <span className="text-blue-600 font-bold shrink-0">•</span>
                <span>{th}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
