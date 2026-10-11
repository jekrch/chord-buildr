import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Link, scroller } from "react-scroll"
import { Eraser, Play, Plus, SquarePen, Undo2 } from "lucide-react"
import { AppState, useAppContext } from "../context/AppContext"
import { playChordById } from "../../utils/synthPlayer"
import { Button } from '../../components/ui/button'
import { 
  getChordDisplay, 
  getProgressionString, 
  convertProgressionStrToCode 
} from "../../utils/chordCodeHandler"
import { generateBaseUrlParams } from "../../utils/urlUtil"
import { isGuitar } from "../../utils/guitarUtil"
import { cn } from "../../lib/utils"
// NEW: Import the modal component from its own file
import { ProgressionEditorModal } from "./ProgressionEditorModal" 

interface ScrollOptions {
  duration: number
  smooth: boolean
  offset: number
  spy: boolean
  hashSpy: boolean
  to: string
}

export const HeaderComponent: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [newChordAdded, setNewChordAdded] = useState(false);
  const [currPlayChordIndex, setCurrPlayChordIndex] = useState(-1);
  const [headerOffset, setHeaderOffset] = useState(-130);
  const [currentlyPlayingPianoId, setCurrentlyPlayingPianoId] = useState<number | undefined>(undefined);
  const [isProgressionEditorOpen, setIsProgressionEditorOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const progressionRef = useRef<HTMLDivElement>(null);
  const [activePianoId, setActivePianoId] = useState<number | undefined>(undefined);
  const [indicator, setIndicator] = useState({ x: 0, y: 0, width: 0, visible: false, snap: true });
  
    /**
   * When a chord is played we want it to be scrolled to. Where we 
   * scroll to should be determined in part by the height of this
   * header so the header doesn't cover the chord when the header 
   * height expands due to large progressions
   */
  useEffect(() => {
    const playingPianoId = state.chordPianoSet?.filter(piano => piano.isPlaying)[0]?.id;
    setCurrentlyPlayingPianoId(playingPianoId);

    const updateOffset = () => {
      if (headerRef.current) {
        const headerHeight = headerRef.current.getBoundingClientRect().height;
        setHeaderOffset(-headerHeight - 10);
      }
    };
    updateOffset();
    const resizeObserver = new ResizeObserver(updateOffset);
    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, [state.chordPianoSet]); // recalculate when chord set changes

  /**
   * Slide the strip's underline to the playing chord, or to the one the
   * page is scrolled to when nothing is playing. When it has been hidden
   * it jumps straight to its spot (snap) and fades in instead of sliding
   * over from wherever it was last
   */
  const indicatorPianoId = currentlyPlayingPianoId ?? activePianoId;

  useLayoutEffect(() => {
    const container = progressionRef.current;
    if (!container) return;

    const place = () => {
      const link = indicatorPianoId === undefined
        ? null
        : container.querySelector<HTMLElement>(`[data-piano-id="${indicatorPianoId}"]`);

      setIndicator(prev => {
        if (!link) return prev.visible ? { ...prev, visible: false } : prev;

        // inset by the link's horizontal padding so the line sits under the text
        const next = {
          x: link.offsetLeft + 4,
          y: link.offsetTop + link.offsetHeight,
          width: link.offsetWidth - 8,
          visible: true,
          snap: !prev.visible
        };
        const unchanged = prev.visible && prev.x === next.x && prev.y === next.y && prev.width === next.width;
        return unchanged ? prev : next;
      });
    };

    place();
    // chords reflow when the strip wraps, the window resizes or fonts load
    const resizeObserver = new ResizeObserver(place);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [indicatorPianoId, state.chordPianoSet]);

  const navigateToPianoById = (pianoId: number): void => {
    const targetKey = `piano-${pianoId}`
    const options: ScrollOptions = {
      duration: 500,
      smooth: true,
      offset: headerOffset,
      spy: true,
      hashSpy: true,
      to: targetKey
    }
    scroller.scrollTo(targetKey, options)
  }

  const handleClickPlay = (): void => {
    if (!state.chordPianoSet?.length) return;
    const nextPianoId = getNextPlayPianoId();
    navigateToPianoById(nextPianoId);
    handleItemClick(nextPianoId);
  }

  const getNextPlayPianoId = (): number => {
    const nextPianoIndex = getNextPlayChordIndex();
    setCurrPlayChordIndex(nextPianoIndex);
    return state.chordPianoSet?.[nextPianoIndex]!.id ?? 0
  }

  const getNextPlayChordIndex = (): number => {
    let nextPianoIndex = currPlayChordIndex + 1
    if (nextPianoIndex >= (state.chordPianoSet?.length ?? 0)) {
      nextPianoIndex = 0
    }
    return nextPianoIndex
  }

  const handleClickAddChord = (): void => {
    dispatch({
      type: "ADD_CHORD_PIANO",
      payload: "selectedKey"
    })
    setNewChordAdded(true)
  }

  useEffect(() => {
    if (!state.chordPianoSet?.length) return

    if (newChordAdded) {
      // the first chord mounts the board itself, mid view-enter lift, and
      // there is nothing above it to scroll past
      if (state.chordPianoSet.length > 1) {
        const lastPianoId = state.chordPianoSet[state.chordPianoSet.length - 1].id ?? 0;
        navigateToPianoById(lastPianoId)
      }
      setNewChordAdded(false)
    }
  }, [state.chordPianoSet, newChordAdded])

  const handleClickClear = (): void => {
    dispatch({
      type: "BUILD_PROG_FROM_CODE",
      payload: generateBaseUrlParams(state)
    })
  }

  const handleUndoClick = (): void => {
    dispatch({
      type: "LOAD_PREVIOUS_PROG_CODE"
    })
  }

  const handleItemClick = (id: number): void => {
    playChordById(dispatch, state, id)
  }

  const getCurrentSynthVolCode = (state: AppState): string => {
    return state?.currentProgCode?.split('p=')?.[0] ?? "?s=p:90&p="
  }

  // UPDATED: This function now simply opens the modal.
  const openProgressionEditor = (): void => {
    setIsProgressionEditorOpen(true);
  }

  // This callback handles the logic after the user saves in the modal.
  const handleSaveProgression = (submittedProgressionStr: string): void => {
    if (!submittedProgressionStr) {
      return
    }
    
    const synthVolCode = getCurrentSynthVolCode(state);
    const newProgressionString = convertProgressionStrToCode(submittedProgressionStr);

    if (newProgressionString) {
      dispatch({
        type: "BUILD_PROG_FROM_CODE",
        payload: `${synthVolCode}p=${newProgressionString}`
      })
      dispatch({
        type: "REFRESH_BOARD"
      })
    }
  }

  const renderProgression = (): React.JSX.Element[] | undefined => {
    return state.chordPianoSet?.map((piano, i) => (
      <div
        key={`ci-${piano.id}`}
        className="flex items-center"
      >
        <Link
          className={cn("chord-link", piano.id === currentlyPlayingPianoId && "is-playing")}
          data-piano-id={piano.id}
          to={`piano-${piano.id}`}
          spy={!isGuitar(state.format)}
          offset={headerOffset}
          isDynamic={true}
          duration={500}
          smooth={true}
          onSetActive={() => setActivePianoId(piano.id)}
          onSetInactive={() => setActivePianoId(id => (id === piano.id ? undefined : id))}
          onClick={() => handleItemClick(piano.id)}
        >
          {getChordDisplay(piano.selectedChord)}
        </Link>
        {i !== (state.chordPianoSet?.length ?? 0) - 1 && (
          <span className="mx-2 h-3.5 w-px bg-border" aria-hidden="true" />
        )}
      </div>
    ))
  }

  // Return a fragment <> to include the modal as a sibling to the nav.
  return (
    <>
      <nav
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm"
      >
        <div className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:gap-2.5 sm:py-3">
          <Button
            size="sm"
            className="px-2.5 sm:h-9 sm:px-4"
            onClick={handleClickPlay}
            disabled={!state.chordPianoSet?.length}
          >
            <Play className="fill-current" />
            Play
          </Button>
          <Button
            size="sm"
            className="px-2.5 sm:h-9 sm:px-4"
            onClick={handleClickAddChord}
          >
            <Plus />
            Add
          </Button>
          <span className="mx-0.5 h-5 w-px bg-border sm:mx-1" aria-hidden="true" />
          <Button
            variant="secondary"
            size="sm"
            className="px-2.5 sm:h-9 sm:px-4"
            disabled={!state.previousProgCodes?.length}
            onClick={handleUndoClick}
          >
            <Undo2 />
            Undo
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="px-2.5 sm:h-9 sm:px-4"
            disabled={!state.chordPianoSet?.length}
            onClick={handleClickClear}
          >
            <Eraser />
            Clear
          </Button>
        </div>

        <div className="border-t border-border/70 bg-card/60">
          <div className="mx-auto flex min-h-11 max-w-[62rem] items-center justify-center gap-2 px-4 py-2">
            <div
              ref={progressionRef}
              className="relative flex flex-wrap items-center justify-center gap-y-2"
            >
              {state.chordPianoSet?.length ? (
                renderProgression()
              ) : (
                <span className="text-sm text-muted-foreground">No chords yet</span>
              )}
              <span
                className="chord-indicator"
                aria-hidden="true"
                data-snap={indicator.snap.toString()}
                style={{
                  width: indicator.width,
                  transform: `translate(${indicator.x}px, ${indicator.y}px)`,
                  opacity: indicator.visible ? 1 : 0
                }}
              />
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-1 shrink-0"
              aria-label="Edit progression as text"
              title="Edit progression as text"
              onClick={openProgressionEditor}
            >
              <SquarePen />
            </Button>
          </div>
        </div>
      </nav>

      {/* Render the modal and pass the necessary props. */}
      <ProgressionEditorModal
        open={isProgressionEditorOpen}
        onOpenChange={setIsProgressionEditorOpen}
        initialProgression={getProgressionString(state.chordPianoSet ?? [])}
        onSave={handleSaveProgression}
      />
    </>
  )
}
