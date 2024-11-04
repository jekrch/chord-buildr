import React, { useEffect, useState, useLayoutEffect } from "react"
import { useAppContext } from "../components/context/AppContext"
import { getProgressionCode } from "../utils/chordCodeHandler"
import { ChordPianoComponent } from "../components/ChordPianoComponent"
import { useHistory } from "react-router-dom"

export const PianoBoardComponent = () => {
  const { state, dispatch } = useAppContext()
  const history = useHistory()
  const [isInitialized, setIsInitialized] = useState(false)
  const [refresh, setRefresh] = useState(0)

  // Handle initial load and URL changes
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

  // Handle URL changes and chord building
  useEffect(() => {
    const currentCode = getProgressionCode(state)
    const newParams = history.location.search + history.location.hash

    if (!state.building && currentCode !== newParams) {
      dispatch({
        type: "BUILD_PROG_FROM_CODE",
        payload: newParams
      })
      setRefresh(prev => prev + 1)
    }
  }, [history.location.search, history.location.hash, state.building, dispatch])

  // Update URL when state changes
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

  const renderChordPianoSet = () => {
    return state.chordPianoSet?.map((chordPiano) => (
      <div key={`wrapper-${chordPiano.id}-${refresh}`}>
        <ChordPianoComponent
          id={`piano-${chordPiano.id}`}
          key={`piano-${chordPiano.id}-${refresh}`}
          className="row chordPianoComponent"
          pianoComponentId={Number(chordPiano.id)}
          history={history}
        />
        <div key={`strip-${chordPiano.id}`} className="pianoStrip" />
      </div>
    ))
  }

  return (
    <div key={`pianoBoard-${refresh}`} className="pianoBoard">
      {state.chordPianoSet?.length ?? 0 > 0 ? (
        <> 
          {renderChordPianoSet()}   
          <div className="pianoBoardGutter" />
        </>
      ) : (
        <div className="introBody">
          <div className="introText">
            welcome to chord buildr<br/>
            use the controls above to get started
          </div>
        </div>
      )}
    </div>
  )
}