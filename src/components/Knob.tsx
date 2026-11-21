import React, { useState } from 'react';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label?: string;
  // how the value is written under the dial; signed (+3, -2) by default
  formatValue?: (value: number) => string;
}

interface Drag {
  pointerId: number
  startY: number
  startValue: number
}

/**
 * a dial dragged up and down, by mouse, touch or pen. it follows the drag
 * locally and only calls onChange when it's let go. the pointer is
 * captured, so the drag carries on outside the dial, and touch-none keeps
 * a touch drag from scrolling the page
 */
export const Knob: React.FC<KnobProps> = ({ value, min, max, onChange, label, formatValue }) => {
  const [drag, setDrag] = useState<Drag | null>(null);
  // where the dial points while it's dragged
  const [draggedValue, setDraggedValue] = useState(value);
  const currentValue = drag ? draggedValue : value;

  // convert value to rotation angle (from -150 to 150 degrees)
  const getRotation = (val: number) => {
    const range = max - min;
    const percentage = (val - min) / range;
    return -150 + (percentage * 300);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // a second finger doesn't take over a drag under way
    if (drag) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ pointerId: e.pointerId, startY: e.clientY, startValue: value });
    setDraggedValue(value);
  };

  // a full sweep of the range takes 100px of drag
  const valueAt = (current: Drag, clientY: number) => {
    const deltaValue = ((current.startY - clientY) / 100) * (max - min);
    return Math.round(Math.min(max, Math.max(min, current.startValue + deltaValue)));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    setDraggedValue(valueAt(drag, e.clientY));
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    setDrag(null);
    // measured from the release itself, as the last move may not have
    // rendered yet. a cancelled drag keeps where it got to
    const final = e.type === 'pointerup' ? valueAt(drag, e.clientY) : draggedValue;
    if (final !== value) onChange(final);
  };

  const rotation = getRotation(currentValue);
  const zeroRotation = getRotation(Math.min(max, Math.max(min, 0)));
  const displayValue = formatValue
    ? formatValue(currentValue)
    : currentValue > 0 ? `+${currentValue}` : `${currentValue}`;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={currentValue}
        className="relative h-14 w-14 cursor-ns-resize touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
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