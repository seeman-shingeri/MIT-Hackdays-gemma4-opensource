import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  X, 
  Sparkles, 
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
    if (!isPlaying) {
      return;
    }

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
    <div className="w-full bg-[#111827] border-b border-amber-500/40 shadow-2xl relative overflow-hidden">
      {/* Top Progress Bar when Playing */}
      {isPlaying && (
        <div
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-amber-500 to-sky-400 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              COMMUNITY PROBLEM REPLAY
            </span>
            <span className="text-xs font-mono text-slate-400 hidden sm:inline">
              5-Minute Guided Demonstration • Case <strong className="text-slate-200">CIV-8492-A</strong>
            </span>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep <= 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 disabled:opacity-30 text-slate-300 text-xs font-mono transition-colors"
              title="Previous Step"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setProgress(0);
                setIsPlaying(!isPlaying);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold transition-colors shadow-md shadow-amber-500/20"
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
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 disabled:opacity-30 text-slate-300 text-xs font-mono transition-colors"
              title="Next Step"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleRestart}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors"
              title="Restart Replay"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-slate-800 mx-1" />

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
              title="Exit Replay"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Replay Step Timeline Chips */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-3">
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
                    ? 'border-amber-400 bg-amber-950/30 ring-1 ring-amber-400/50'
                    : isCompleted
                    ? 'border-slate-700 bg-slate-900/80 hover:border-slate-600'
                    : 'border-slate-800 bg-slate-950/40 opacity-60 hover:opacity-90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    STEP {s.stepNumber}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] font-mono text-amber-400">{s.timeLabel}</span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                  {s.title.split('&')[0]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Current Step Detailed Narrative Box */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400">
                {step.badge}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono text-slate-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {step.timeLabel}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono text-sky-300 flex items-center gap-1">
                <User className="w-3 h-3 text-sky-400" />
                {step.reporter}
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {step.summary}
            </p>
          </div>

          {/* Technical highlights bullet pill list */}
          <div className="w-full md:w-auto md:min-w-[340px] space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              Autonomous Intelligence Execution:
            </div>
            {step.technicalHighlights.map((th, idx) => (
              <div key={idx} className="text-[11px] text-slate-300 font-mono flex items-start gap-1.5 leading-tight">
                <span className="text-sky-400 shrink-0">▸</span>
                <span>{th}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
