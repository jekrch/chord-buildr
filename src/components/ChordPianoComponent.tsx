import React from "react"
import "../styles/Piano.css"
import { PianoComponent } from "./PianoComponent"
import { ChordInput } from "./ChordInput"
import { SortableChordCard } from "./SortableChordCard"
import { cn } from "../lib/utils"

interface ChordPianoComponentProps {
  pianoComponentId: number
  className?: string
}

export const ChordPianoComponent: React.FC<ChordPianoComponentProps> = ({ pianoComponentId, className }) => {
  return (
    <SortableChordCard
      pianoId={pianoComponentId}
      className={cn("chord-card--piano", className)}
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
    </SortableChordCard>
  )
}
