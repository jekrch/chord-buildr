import React from "react";

interface PianoKeyProps {
  pianoKey: {
    selected: boolean;
    isPlaying: boolean;
    isStopping: boolean | null;
    note: string;
    octave: number;
    color?: string;
    noteNumber: number;
  };
  handleClick: (note: string, noteNumber: number, octave: number) => void;
}

export const Key: React.FC<PianoKeyProps> = ({ pianoKey, handleClick }) => {
  const { selected, isPlaying, isStopping, color, note, octave, noteNumber } = pianoKey;

  return (
    <li
      key-selected={selected?.toString()}
      key-playing={isPlaying?.toString()}
      key-stopping={isStopping?.toString()}
      className={`${color} ${note} ${note}-${octave}`}
      onClick={() => handleClick(note, noteNumber, octave)}
    />
  );
};