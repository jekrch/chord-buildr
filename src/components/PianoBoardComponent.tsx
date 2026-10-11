import React, { useEffect, useState, useLayoutEffect, useMemo, useRef, memo } from "react"
import { useHistory } from "react-router-dom"
import { useAppContext } from "../components/context/AppContext"
import { getStateParamsCode } from "../utils/chordCodeHandler"
import { ChordPianoComponent } from "../components/ChordPianoComponent"
import { ChordInput } from "./ChordInput"
import { GuitarChord } from "./GuitarChord"
import useNavHeight from "../utils/hooks/useNavHeight"
import { isGuitar } from '../utils/guitarUtil'
import InlineConfig from './InlineConfig'
import MusicalAnimation from "./MusicalAnimation"
import { cn } from "../lib/utils"

// existing memoized components remain the same
const MemoizedChordPiano = memo(({ id, refresh, entering }: { id: number, refresh: number, entering: boolean }) => (
  <ChordPianoComponent
    key={`piano-${id}-${refresh}`}
    pianoComponentId={Number(id)}
    className={cn(entering && "chord-enter")}
  />
))

const MemoizedGuitarChordSet = memo(({ id, entering }: { id: number, entering: boolean }) => (
  <article
    id={`piano-${id}`}
    className={cn("chord-card chord-card--guitar", entering && "chord-enter")}
    data-flip
  >
    <ChordInput className="chord-card__controls" pianoComponentId={id} />
    <GuitarChord pianoComponentId={id} />
  </article>
))

export const PianoBoardComponent: React.FC = () => {
  const { state, dispatch } = useAppContext()
  const history = useHistory()
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [refresh, setRefresh] = useState<number>(0)
  const navHeight = useNavHeight('nav')
  const boardRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const spacerRef = useRef<HTMLDivElement>(null)
  const hasChords = !!state.chordPianoSet?.length

  /**
   * a view is the welcome screen or a board in one format. chords already
   * present when a view mounts arrive with the view's own transition, so
   * only chords added after that get the chord-enter animation
   */
  const viewKey = `${refresh}-${state.format}-${hasChords}`
  const chordIds = state.chordPianoSet?.map((chordPiano) => chordPiano.id) ?? []
  const [viewChords, setViewChords] = useState({ viewKey, ids: chordIds })
  if (viewChords.viewKey !== viewKey) {
    setViewChords({ viewKey, ids: chordIds })
  }
  const initialIds = viewChords.ids

  useEffect(() => {
    document.documentElement.setAttribute('data-format', isGuitar(state.format) ? 'g' : 'p')
  }, [state.format])

  useLayoutEffect(() => {
    if (!isInitialized && (history.location.search || history.location.hash)) {
      dispatch({
        type: "BUILD_PROG_FROM_CODE",
        payload: history.location.search + history.location.hash
      })
      setIsInitialized(true)
      setRefresh(prev => prev + 1)
    }
  }, [history.location.search, history.location.hash, isInitialized, dispatch])

  useLayoutEffect(() => {
    if (state.refreshBoard && state.refreshBoard !== refresh) {
      setRefresh(state.refreshBoard)
    }
  }, [state.refreshBoard, refresh])

  useEffect(() => {
    if (!state.chordPianoSet) return

    const currentCode = "?" + getStateParamsCode(state)
    const newParams = history.location.search + history.location.hash

    if (currentCode !== newParams) {
      history.push({ search: currentCode })
    }
  }, [state, history])

  /**
   * size the bottom spacer so the page can scroll just far enough for the
   * last chord to reach the top (below the header), and no further
   */
  useLayoutEffect(() => {
    const board = boardRef.current
    const content = contentRef.current
    const spacer = spacerRef.current
    if (!board || !content || !spacer) return

    const updateSpacer = () => {
      const chords = content.querySelectorAll('[id^="piano-"]')
      const lastChord = chords[chords.length - 1]
      if (!lastChord) {
        spacer.style.height = '0px'
        return
      }
      const currentSpacer = spacer.getBoundingClientRect().height
      const lastChordTop = lastChord.getBoundingClientRect().top + window.scrollY
      const scrollHeightWithoutSpacer = document.documentElement.scrollHeight - currentSpacer
      // matches the offset used when navigating to a chord from the header
      const targetScrollTop = lastChordTop - navHeight - 10
      const needed = targetScrollTop + window.innerHeight - scrollHeightWithoutSpacer
      spacer.style.height = `${Math.max(0, Math.ceil(needed))}px`
    }

    updateSpacer()
    const resizeObserver = new ResizeObserver(updateSpacer)
    resizeObserver.observe(content)
    window.addEventListener('resize', updateSpacer)
    // the first measurement is taken mid view-enter, offset by its lift
    board.addEventListener('animationend', updateSpacer)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateSpacer)
      board.removeEventListener('animationend', updateSpacer)
    }
  }, [navHeight, viewKey])

  const renderPianoSet = useMemo(() => {
    if (!state.chordPianoSet) return null
    
    return state.chordPianoSet.map((chordPiano) => (
      <MemoizedChordPiano
        key={`wrapper-${chordPiano.id}-${refresh}`}
        id={chordPiano.id}
        refresh={refresh}
        entering={!initialIds.includes(chordPiano.id)}
      />
    ))
  }, [state.chordPianoSet, refresh, initialIds])

  const renderGuitarSet = useMemo(() => {
    if (!state.chordPianoSet) return null

    return (
      <div className="guitar-board">
        <div className="guitar-grid">
          {state.chordPianoSet.map((chordPiano) => (
            <MemoizedGuitarChordSet
              key={chordPiano.id}
              id={chordPiano.id}
              entering={!initialIds.includes(chordPiano.id)}
            />
          ))}
        </div>
      </div>
    )
  }, [state.chordPianoSet, initialIds])

  if (!state.chordPianoSet?.length) {
    return (
      <div
        key="welcome"
        className="pianoBoard view-enter mx-auto flex max-w-md flex-col items-center px-6 text-center"
        style={{ paddingTop: `${navHeight + 80}px` }}
      >
        <MusicalAnimation />
        <h1 className="mt-10 text-lg font-semibold tracking-tight">
          Welcome to Chord Buildr
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Use the controls above to get started.
        </p>
        <InlineConfig className="mt-8" />
      </div>
    )
  }

  return (
    <div
      key={`pianoBoard-${viewKey}`}
      ref={boardRef}
      className={cn(
        "pianoBoard view-enter mx-auto w-full px-2.5 sm:px-4",
        isGuitar(state.format) ? "max-w-[84rem]" : "max-w-[62rem]"
      )}
      style={{ paddingTop: `${navHeight + 16}px` }}
    >
      <div ref={contentRef}>
        {!isGuitar(state.format) ? (
          <div className="flex flex-col gap-3 sm:gap-4">{renderPianoSet}</div>
        ) : renderGuitarSet}
        <div data-flip>
          <InlineConfig className="mt-10" />
        </div>
      </div>
      <div ref={spacerRef} aria-hidden="true" />
    </div>
  )
}
