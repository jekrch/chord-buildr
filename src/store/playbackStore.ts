import { create } from "zustand"

/**
 * what's playing right now. kept apart from the progression since it
 * changes on a timer and is never saved or put in the url: a chord
 * starting or stopping only re-renders its own card and the header strip
 */

export type KeyPhase = "playing" | "stopping"

export interface PlayingKeys {
  // the piano keys that were played (see getChordKeys)
  notes: readonly number[]
  // "playing" lights them up; "stopping" fades them back
  phase: KeyPhase
}

interface PlaybackStore {
  // the chord most recently started, until it's done
  playingChordId?: number
  // the piano keys each chord last played
  keys: Record<number, PlayingKeys>
}

export const usePlaybackStore = create<PlaybackStore>()(() => ({
  playingChordId: undefined,
  keys: {}
}))

export function startChordPlayback(id: number): void {
  usePlaybackStore.setState({ playingChordId: id })
}

// a chord played since has taken over, so only this chord's own end counts
export function endChordPlayback(id: number): void {
  if (usePlaybackStore.getState().playingChordId === id) {
    usePlaybackStore.setState({ playingChordId: undefined })
  }
}

/**
 * lights up the piano keys a chord plays. returns the entry, which
 * releaseChordKeys takes so a chord played again before its keys are
 * released keeps them lit
 */
export function playChordKeys(id: number, notes: readonly number[]): PlayingKeys {
  const entry: PlayingKeys = { notes, phase: "playing" }
  usePlaybackStore.setState((state) => ({ keys: { ...state.keys, [id]: entry } }))
  return entry
}

export function releaseChordKeys(id: number, entry: PlayingKeys): void {
  const { keys } = usePlaybackStore.getState()
  if (keys[id] !== entry) return

  usePlaybackStore.setState({ keys: { ...keys, [id]: { ...entry, phase: "stopping" } } })
}

export const useIsChordPlaying = (id: number): boolean =>
  usePlaybackStore((state) => state.playingChordId === id)

export const usePlayingChordId = (): number | undefined =>
  usePlaybackStore((state) => state.playingChordId)

export const usePlayingKeys = (id: number): PlayingKeys | undefined =>
  usePlaybackStore((state) => state.keys[id])
