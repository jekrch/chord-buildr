import React, { useEffect, useState, useLayoutEffect } from "react"
import { useHistory } from "react-router-dom"
import { useAppContext } from "../components/context/AppContext"
import { getProgressionCode } from "../utils/chordCodeHandler"
// @ts-ignores
import { ChordPianoComponent } from "../components/ChordPianoComponent"
import { ChordInput } from "./ChordInput"
import { GuitarChord } from "./GuitarChord"

export const PianoBoardComponent: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const history = useHistory()
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [refresh, setRefresh] = useState<number>(0)

  // handle initial load and URL changes
  useLayoutEffect(() => {
    const handleInitialLoad = () => {
      const newParams = history.location.search + history.location.hash
      if (!isInitialized && newParams) {
        dispatch({
          type: "BUILD_PROG_FROM_CODE",
          payload: newParams
        })
        setIsInitialized(true)
        setRefresh(prev => prev + 1)
      }
    }

    handleInitialLoad()
  }, [history.location.search, history.location.hash, isInitialized, dispatch])

  // used to force a rerender from other components 
  useLayoutEffect(() => {
    const handleRefresh = () => {
      if (state.refreshBoard && state.refreshBoard !== refresh) {
        setRefresh(state.refreshBoard)
      }
    }

    handleRefresh()
  }, [state.refreshBoard, refresh])

  // update URL when state changes
  useEffect(() => {
    if (!state.chordPianoSet) {
      return
    }

    const currentCode = getProgressionCode(state)
    const newParams = history.location.search + history.location.hash

    if (currentCode !== newParams) {
      history.push({
        search: currentCode
      })
    }
  }, [state, history])

  let renderChordPianoSet;

  if (true) {
    renderChordPianoSet = (): React.ReactNode => {
      return state.chordPianoSet?.map((chordPiano) => (
        <div key={`wrapper-${chordPiano.id}-${refresh}`}>
          <ChordPianoComponent
            key={`piano-${chordPiano.id}-${refresh}`}
            pianoComponentId={Number(chordPiano.id)}
          />
          <div key={`strip-${chordPiano.id}`} className="pianoStrip" />
        </div>
      ))
    }
  } else {
    renderChordPianoSet = (): React.ReactNode => {
      return <div className="container">
        <div className="row g-3 guitar-container">
          {state.chordPianoSet?.map((chordPiano) => (
            <div key={chordPiano.id} className="col-12 col-sm-6 col-md-6 col-lg-8">
              <div className="card">
                <div className="card-body">
                  <ChordInput
                    pianoComponentId={chordPiano.id} />
                  <GuitarChord pianoComponentId={chordPiano.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    }
  }

  return (
    <div key={`pianoBoard-${refresh}`} className="pianoBoard">
      {state.chordPianoSet?.length ?? 0 > 0 ? (
        <>
          {renderChordPianoSet()}
          <div className="h-[10em]" />
        </>
      ) : (
        <div className="introBody">
          <div className="introText">
            welcome to chord buildr<br />
            use the controls above to get started
          </div>
        </div>
      )}
    </div>
  )
}