import React from "react"
import "../styles/Piano.css"
import { PianoComponent } from "./PianoComponent"
import { ChordInput } from "./ChordInput"
import { GuitarChord } from "./GuitarChord"

interface ChordPianoComponentProps {
  pianoComponentId: number
}

export const ChordPianoComponent: React.FC<ChordPianoComponentProps> = ({ pianoComponentId }) => {
  return (
    <>
      <div className="container chordPiano" id={`piano-${pianoComponentId}`}>
        <div className="contentBox row">
          <div className="pianoChordBox">
            <ChordInput
              key={`c-${pianoComponentId}`}
              pianoComponentId={pianoComponentId}
            />
            <GuitarChord pianoComponentId={pianoComponentId} />
            {/* <PianoComponent
              key={Number(pianoComponentId)}
              pianoComponentId={Number(pianoComponentId)}
            /> */}
          </div>
        </div>
      </div>
    </>
  )
}