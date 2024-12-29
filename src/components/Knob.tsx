import React, { useState, useEffect } from 'react';

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

  // convert value to rotation angle (from -150 to 150 degrees)
  const getRotation = (val: number) => {
    const range = max - min;
    const percentage = (val - min) / range;
    return -150 + (percentage * 300);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartValue(currentValue);
  };

  // sync the local value with prop when it changes externally
  useEffect(() => {
    if (!isDragging) {
      setCurrentValue(value);
    }
  }, [value, isDragging]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaY = startY - e.clientY;
      const deltaValue = (deltaY / 100) * (max - min);
      const newValue = Math.min(max, Math.max(min, startValue + deltaValue));
      
      // update local state during drag
      setCurrentValue(Math.round(newValue));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // only trigger onChange when mouse is released
      onChange(currentValue);
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

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className="w-10 h-10 rounded-full bg-gray-500 relative cursor-pointer select-none"
        onMouseDown={handleMouseDown}
      >
        <div 
          className="absolute w-1 h-5 bg-slate-200 rounded-full left-1/2 -translate-x-1/2 origin-bottom"
          style={{ 
            transform: `translateX(-50%) rotate(${getRotation(currentValue)}deg)`,
            bottom: '50%'
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
          <div className="bg-slate-700 w-6 h-6 text-center pt-[0.1em] rounded-full">
            {currentValue}
          </div>
        </div>
      </div>
      {label && (
        <span className="text-sm text-slate-400">{label}</span>
      )}
    </div>
  );
};

export default Knob;