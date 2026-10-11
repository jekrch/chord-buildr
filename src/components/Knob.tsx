import React, { useState, useEffect, useRef } from 'react';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label?: string;
}

export const Knob: React.FC<KnobProps> = ({ value, min, max, onChange, label }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);
  // local state to handle the visual position during dragging
  const [currentValue, setCurrentValue] = useState(value);
  const knobRef = useRef<HTMLDivElement>(null);

  // convert value to rotation angle (from -150 to 150 degrees)
  const getRotation = (val: number) => {
    const range = max - min;
    const percentage = (val - min) / range;
    return -150 + (percentage * 300);
  };

  const handleStart = (clientY: number) => {
    setIsDragging(true);
    setStartY(clientY);
    setStartValue(currentValue);
  };

  const handleMove = (clientY: number) => {
    if (!isDragging) return;

    const deltaY = startY - clientY;
    const deltaValue = (deltaY / 100) * (max - min);
    const newValue = Math.min(max, Math.max(min, startValue + deltaValue));
    
    setCurrentValue(Math.round(newValue));
  };

  const handleEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      onChange(currentValue);
    }
  };

  // mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientY);
  };

  // sync the local value with prop when it changes externally
  useEffect(() => {
    if (!isDragging) {
      setCurrentValue(value);
    }
  }, [value, isDragging]);

  // setup mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientY);
    };

    const handleMouseUp = () => {
      handleEnd();
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startY, startValue, min, max, onChange, currentValue]);

  // setup touch events with non-passive listeners
  useEffect(() => {
    const element = knobRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleStart(touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleEnd();
    };

    // add touch event listeners with { passive: false }
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, startY, startValue, min, max, onChange, currentValue]);

  const rotation = getRotation(currentValue);
  const zeroRotation = getRotation(Math.min(max, Math.max(min, 0)));
  const displayValue = currentValue > 0 ? `+${currentValue}` : `${currentValue}`;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        ref={knobRef}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={currentValue}
        className="relative h-14 w-14 cursor-ns-resize touch-none select-none"
        onMouseDown={handleMouseDown}
      >
        <svg viewBox="0 0 56 56" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <path
            d={describeArc(28, 28, 25, -150, 150)}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {rotation !== zeroRotation && (
            <path
              d={describeArc(28, 28, 25, Math.min(zeroRotation, rotation), Math.max(zeroRotation, rotation))}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-[9px] rounded-full border border-border bg-gradient-to-b from-accent to-secondary shadow-[0_2px_4px_rgb(0_0_0/0.4),inset_0_1px_0_rgb(255_255_255/0.06)]">
          <div
            className="absolute bottom-1/2 left-1/2 h-[42%] w-[2px] origin-bottom rounded-full bg-foreground"
            style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
          />
        </div>
      </div>
      {label && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
      <span className="-mt-1 text-xs font-medium tabular-nums">{displayValue}</span>
    </div>
  );
};

// svg arc path between two angles, measured clockwise from 12 o'clock
function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
  };
  const start = point(startDeg);
  const end = point(endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export default Knob;