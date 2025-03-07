import React, { useEffect, useState, useLayoutEffect, useMemo, memo } from "react"
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

// existing memoized components remain the same
const MemoizedChordPiano = memo(({ id, refresh }: { id: number, refresh: number }) => (
  <div className="lg:!ml-[20%]">
    <ChordPianoComponent
      key={`piano-${id}-${refresh}`}
      pianoComponentId={Number(id)}
    />
    <div className="pianoStrip" />
  </div>
))

const MemoizedGuitarChordSet = memo(({ id }: { id: number }) => (
  <div className="lg:w-2/3 w-[23em] h-[14em]">
    <div>
      <div className="px-4 flex tab-container">
        <ChordInput pianoComponentId={id} />
        <GuitarChord pianoComponentId={id} />
      </div>
    </div>
  </div>
))

export const PianoBoardComponent: React.FC = () => {
  const { state, dispatch } = useAppContext()
  const history = useHistory()
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [refresh, setRefresh] = useState<number>(0)
  const navHeight = useNavHeight('nav')

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

  const renderPianoSet = useMemo(() => {
    if (!state.chordPianoSet) return null
    
    return state.chordPianoSet.map((chordPiano) => (
      <MemoizedChordPiano
        key={`wrapper-${chordPiano.id}-${refresh}`}
        id={chordPiano.id}
        refresh={refresh}
      />
    ))
  }, [state.chordPianoSet, refresh])

  const renderGuitarSet = useMemo(() => {
    if (!state.chordPianoSet) return null

    return (
      <div className="container mx-auto px-4">
        <div className="grid spacing-x-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 sm:gap-x-[4.8em] sm:!-ml-[3.5em]">
          {state.chordPianoSet.map((chordPiano) => (
            <MemoizedGuitarChordSet
              key={chordPiano.id}
              id={chordPiano.id}
            />
          ))}
        </div>
      </div>
    )
  }, [state.chordPianoSet])

  if (!state.chordPianoSet?.length) {
    return (
      <div className="pianoBoard">
        <div className="introBody">
          <MusicalAnimation />
          <div className="introText">
            welcome to chord buildr<br />
            use the controls above to get started
          </div>
          <InlineConfig />
        </div>
      </div>
    )
  }

  return (
    <div 
      key={`pianoBoard-${refresh}`} 
      className="pianoBoard"
      style={{ marginTop: `${navHeight - 100}px` }}
    >
      {!isGuitar(state.format) ? renderPianoSet : renderGuitarSet}
      <InlineConfig className="-ml-[2.4em]"/>
      <div className="h-[100vh]" />
    </div>
  )
}