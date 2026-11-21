import React from "react";
import { NoteKey } from "../utils/chordPianoHandler";

interface PianoKeyProps {
  pianoKey: NoteKey;
  isPlaying: boolean;
  isStopping: boolean;
  handleClick: (note: string, noteNumber: number, octave: number) => void;
}

export const Key: React.FC<PianoKeyProps> = ({ pianoKey, isPlaying, isStopping, handleClick }) => {
  const { selected, color, note, octave, noteNumber } = pianoKey;

  return (
    <li
      key-selected={selected.toString()}
      key-playing={isPlaying.toString()}
      key-stopping={isStopping.toString()}
      className={`${color} ${note} ${note}-${octave}`}
      onClick={() => handleClick(note, noteNumber, octave)}
    />
  );
};
