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
  beforeLabel = 'BEFORE REPAIR (Reported Incident)',
  afterLabel = 'AFTER REPAIR (Completed Work)',
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clamped = Math.max(0, Math.min(rect.width, x));
    setSliderPos((clamped / rect.width) * 100);
  }, []);

  const onMouseDown = () => {
    isDragging.current = true;
  };

  const onMouseUp = () => {
    isDragging.current = false;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      handleMove(e.clientX);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden select-none border border-slate-700 bg-slate-950 cursor-ew-resize shadow-2xl"
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onMouseMove={onMouseMove}
      onTouchMove={onTouchMove}
    >
      {/* After Image (Background Layer) */}
      <img
        src={afterUrl}
        alt="After repair condition"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-xs font-mono font-semibold tracking-wider backdrop-blur-sm">
        {afterLabel}
      </div>

      {/* Before Image (Clipped with CSS clip-path - no ref access during render) */}
      <img
        src={beforeUrl}
        alt="Before repair condition"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        draggable={false}
      />
      <div
        className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded bg-rose-950/80 border border-rose-500/50 text-rose-400 text-xs font-mono font-semibold tracking-wider backdrop-blur-sm"
        style={{ opacity: sliderPos > 15 ? 1 : 0 }}
      >
        {beforeLabel}
      </div>

      {/* Divider Line & Draggable Handle */}
      <div
        className="absolute top-0 bottom-0 z-20 w-1 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-slate-900 border-2 border-white shadow-xl flex items-center justify-center text-slate-100 text-xs font-bold pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-105 transition-transform">
          ⇄
        </div>
      </div>

      {/* Instruction pill at bottom */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 text-[11px] font-mono pointer-events-none backdrop-blur-sm">
        Drag slider to inspect visual changes ({Math.round(sliderPos)}%)
      </div>
    </div>
  );
};
