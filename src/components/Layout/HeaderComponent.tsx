import React, { useCallback, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { useActions, useAppStore, useChords, useSettings } from "../../store/progressionStore"
import { usePlayingChordId } from "../../store/playbackStore"
import { playChordById } from "../../audio/player"
import { getProgressionString, convertProgressionStrToCode } from "../../codec"
import { isGuitar } from "../../utils/settings"
import { scrollToChord } from "../../utils/scrollToChord"
import { useStripGlide } from "../../utils/hooks/useStripGlide"
import { useStripFollow } from "../../utils/hooks/useStripFollow"
import { useVisibleChordRange } from "../../utils/hooks/useVisibleChordRange"
import { useProgressionPlayback } from "../../utils/hooks/useProgressionPlayback"
import { HeaderActions } from "./HeaderActions"
import { ChordStrip } from "./ChordStrip"
import { lazyModal } from "./lazyModal"

const ProgressionEditorModal = lazyModal(() =>
  import("./ProgressionEditorModal").then((m) => ({ default: m.ProgressionEditorModal }))
)

/**
 * the fixed header: the progression's actions, and the chord strip that
 * follows the page as it scrolls
 */
export const HeaderComponent: React.FC = () => {
  const chords = useChords()
  const { format, fretView } = useSettings()
  const { addChord, loadProgression } = useActions()
  // the chord playing now, on desktop and mobile alike
  const playingId = usePlayingChordId()
  const headerRef = useRef<HTMLElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const [stripExpanded, setStripExpanded] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  // the grid layouts put several cards on a line, so only the piano's
  // single column has one chord the page is scrolled to
  const { range, activeId } = useVisibleChordRange(headerRef, chords, `${format}-${fretView}`, !isGuitar(format))

  const glide = useStripGlide(stripRef)
  const { pause: pauseFollow } = useStripFollow({
    stripRef,
    glide,
    range,
    playingId,
    expanded: stripExpanded,
    chordOrder: chords.map(piano => piano.id).join(",")
  })

  // a chord played from the strip or the play button is scrolled to
  const playChord = useCallback((id: number) => {
    scrollToChord(id)
    pauseFollow()
    playChordById(id)
  }, [pauseFollow])

  const playNext = useProgressionPlayback(chords, playChord)

  const handleAddChord = (): void => {
    // commit now so the new card is laid out before scrolling to it
    flushSync(addChord)
    const { chords } = useAppStore.getState()
    const added = chords[chords.length - 1]
    // the first chord mounts the board itself, mid view-enter lift, and
    // there is nothing above it to scroll past
    if (added && chords.length > 1) scrollToChord(added.id)
  }

  const handleSaveProgression = (submitted: string): void => {
    if (!submitted) return
    const progCode = convertProgressionStrToCode(submitted)
    if (progCode) loadProgression(progCode)
  }

  return (
    <>
      <nav
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm"
      >
        <HeaderActions onPlay={playNext} onAdd={handleAddChord} />
        <ChordStrip
          stripRef={stripRef}
          chords={chords}
          playingId={playingId}
          // the playing chord, or the one scrolled to when none is
          indicatorId={playingId ?? activeId}
          expanded={stripExpanded}
          onExpandedChange={setStripExpanded}
          onChordClick={playChord}
          onStripGrabbed={glide.stop}
          onEdit={() => setIsEditorOpen(true)}
        />
      </nav>

      <ProgressionEditorModal
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        initialProgression={getProgressionString(chords)}
        onSave={handleSaveProgression}
      />
    </>
  )
}
