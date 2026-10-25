import React, { useState, useRef, useCallback } from 'react';

interface ImageComparisonSliderProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  beforeUrl,
  afterUrl,
  beforeLabel = 'Before Repair (Reported)',
  afterLabel = 'After Repair (Completed)',
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clamped = Math.max(0, Math.min(rect.width, x));
    setSliderPos((clamped / rect.width) * 100);
  }, []);

  // Pointer event handlers with pointer capture for touch + mouse
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // In synthetic or test environments where pointer capture is unsupported
    }
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      updatePosition(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      isDragging.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setSliderPos(prev => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setSliderPos(prev => Math.min(100, prev + 5));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSliderPos(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSliderPos(100);
    }
  };

  return (
    <div className="space-y-2 select-none">
      <div
        ref={containerRef}
        role="slider"
        tabIndex={0}
        aria-valuenow={Math.round(sliderPos)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Before and after repair comparison slider"
        className="relative w-full aspect-16/10 sm:aspect-16/9 md:aspect-21/9 min-h-[260px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 cursor-ew-resize shadow-xs touch-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        {/* After Image (Background Layer) */}
        <img
          src={afterUrl}
          alt="After repair condition"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-md bg-white/95 border border-slate-200/80 text-slate-800 text-xs font-semibold tracking-tight shadow-sm backdrop-blur-xs flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{afterLabel}</span>
        </div>

        {/* Before Image (Clipped Layer with CSS clip-path) */}
        <img
          src={beforeUrl}
          alt="Before repair condition"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          draggable={false}
        />
        <div
          className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-white/95 border border-slate-200/80 text-slate-800 text-xs font-semibold tracking-tight shadow-sm backdrop-blur-xs flex items-center gap-1.5 transition-opacity"
          style={{ opacity: sliderPos > 15 ? 1 : 0 }}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>{beforeLabel}</span>
        </div>

        {/* Divider Line & Touch-Friendly Handle (48x48px target) */}
        <div
          className="absolute top-0 bottom-0 z-20 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.35)] pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white border-2 border-blue-600 shadow-lg flex items-center justify-center text-blue-700 pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95 transition-transform"
            title="Drag or use arrow keys to inspect"
          >
            <span className="font-mono text-xs font-bold">⇄</span>
          </div>
        </div>

        {/* Instruction badge at bottom */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-white/90 border border-slate-200 text-slate-700 text-xs font-medium pointer-events-none backdrop-blur-xs shadow-sm">
          Slide or tap to inspect: {Math.round(sliderPos)}%
        </div>
      </div>

      {/* Touch-Friendly Quick Preset Buttons for Mobile */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span className="hidden sm:inline">Tip: Drag handle or tap presets below to evaluate repair</span>
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
          <button
            type="button"
            onClick={() => setSliderPos(0)}
            className={`min-h-[36px] px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
              sliderPos === 0
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            100% After
          </button>
          <button
            type="button"
            onClick={() => setSliderPos(50)}
            className={`min-h-[36px] px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
              sliderPos === 50
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            50% Split
          </button>
          <button
            type="button"
            onClick={() => setSliderPos(100)}
            className={`min-h-[36px] px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
              sliderPos === 100
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            100% Before
          </button>
        </div>
      </div>
    </div>
  );
};
