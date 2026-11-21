import { useCallback, useRef } from "react"
import { ChordPiano } from "../chordPianoHandler"

/**
 * the header's play button steps through the progression one chord per
 * press, starting over after the last. returns the step, which hands the
 * next chord's id to `playChord`
 */
export function useProgressionPlayback(
  chords: readonly ChordPiano[],
  playChord: (id: number) => void
): () => void {
  // the chord played last, by position: chords added, removed or moved
  // since then don't restart the run
  const indexRef = useRef(-1)

  return useCallback(() => {
    const next = indexRef.current + 1 < chords.length ? indexRef.current + 1 : 0
    const chord = chords[next]
    if (!chord) return
    indexRef.current = next
    playChord(chord.id)
  }, [chords, playChord])
}
