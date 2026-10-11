import React from "react"
import "../styles/Piano.css"
import { PianoComponent } from "./PianoComponent"
import { ChordInput } from "./ChordInput"
import { cn } from "../lib/utils"

interface ChordPianoComponentProps {
  pianoComponentId: number
  className?: string
}

export const ChordPianoComponent: React.FC<ChordPianoComponentProps> = ({ pianoComponentId, className }) => {
  return (
    <article
      className={cn("chord-card chord-card--piano", className)}
      id={`piano-${pianoComponentId}`}
      data-flip
    >
      <ChordInput
        key={`c-${pianoComponentId}`}
        className="chord-card__controls"
        pianoComponentId={pianoComponentId}
      />
      <PianoComponent
        key={Number(pianoComponentId)}
        pianoComponentId={Number(pianoComponentId)}
      />
    </article>
  )
}
