import React from "react"
import "../styles/Piano.css"
import { PianoComponent } from "./PianoComponent"
import { ChordInput } from "./ChordInput"

interface ChordPianoComponentProps {
  pianoComponentId: number
}

export const ChordPianoComponent: React.FC<ChordPianoComponentProps> = ({ pianoComponentId }) => {
  return (
    <>
      <div 
        className="container chordPiano" 
        id={`piano-${pianoComponentId}`}
      >
        <div className="!mt-[-1em] sm:mt-0 relative row">
          <div className="">
            <ChordInput
              key={`c-${pianoComponentId}`}
              pianoComponentId={pianoComponentId}
            />           
            <PianoComponent
              key={Number(pianoComponentId)}
              pianoComponentId={Number(pianoComponentId)}
            />
          </div>
        </div>
      </div>
    </>
  )
}