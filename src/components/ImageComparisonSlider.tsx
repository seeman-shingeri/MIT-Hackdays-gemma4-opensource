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
      className="relative w-full h-80 sm:h-96 md:h-[420px] rounded-xl overflow-hidden select-none border border-slate-200 bg-slate-100 cursor-ew-resize shadow-sm"
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
      <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-md bg-white/95 border border-slate-200/80 text-slate-800 text-xs font-medium tracking-tight shadow-sm backdrop-blur-sm flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        {afterLabel}
      </div>

      {/* Before Image (Clipped Layer with CSS clip-path) */}
      <img
        src={beforeUrl}
        alt="Before repair condition"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        draggable={false}
      />
      <div
        className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-white/95 border border-slate-200/80 text-slate-800 text-xs font-medium tracking-tight shadow-sm backdrop-blur-sm flex items-center gap-1.5 transition-opacity"
        style={{ opacity: sliderPos > 15 ? 1 : 0 }}
      >
        <span className="w-2 h-2 rounded-full bg-rose-500" />
        {beforeLabel}
      </div>

      {/* Divider Line & Draggable Handle */}
      <div
        className="absolute top-0 bottom-0 z-20 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.3)] pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 text-xs font-bold pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-105 transition-transform">
          <span className="text-slate-600 font-mono text-[10px]">⇄</span>
        </div>
      </div>

      {/* Instruction badge at bottom */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-white/90 border border-slate-200 text-slate-600 text-xs font-medium pointer-events-none backdrop-blur-sm shadow-sm">
        Drag slider to compare ({Math.round(sliderPos)}%)
      </div>
    </div>
  );
};
