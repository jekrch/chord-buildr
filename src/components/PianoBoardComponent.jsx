import React, { useContext, useEffect } from "react"
import "../styles/Piano.css"
import { useAppContext } from "../components/context/AppContext"
import { getProgressionCode } from "../utils/chordCodeHandler"
import { ChordPianoComponent } from "../components/ChordPianoComponent"
import { useHistory } from "react-router-dom"

export const PianoBoardComponent = () => {
  const { state, dispatch } = useAppContext()

  const history = useHistory()
  state.history = history

  const [, updateState] = React.useState()
  const forceUpdate = React.useCallback(() => updateState({}), [])

  useEffect(() => {
    forceUpdate()
  }, [state.chordPianoSet, forceUpdate])

 // buildChordsFromUrl(state, history, dispatch)

  useEffect(() => {
    
    const currentCode = getProgressionCode(state);
    const newParams = history.location.search + history.location.hash;

    if (!state.building && currentCode !== newParams) {
      console.log("New chord code provided " + currentCode + " vs " + newParams);
      
      dispatch({
        type: "BUILD_PROG_FROM_CODE",
        payload: newParams
      });
    }
  }, [history.location.search, history.location.hash, state.building]); 

  const renderChordPianoSet = () => {
    return state.chordPianoSet.map((chordPiano) => (
      <div key={chordPiano.id}>
        <ChordPianoComponent
          id={"piano-" + chordPiano.id}
          key={"piano-" + chordPiano.id}
          className="row chordPianoComponent"
          pianoComponentId={Number(chordPiano.id)}
          history={history}
        />
        <div key={"strip-" + chordPiano.id} className="pianoStrip" />
      </div>
    ))
  }

  return (
    <div key="pianoBoard" className="pianoBoard">
      {state.chordPianoSet.length > 0 ? 
        <> 
          {renderChordPianoSet()}   
          <div className="pianoBoardGutter" />
        </>
      : 
        <>
          <div className="introBody">
            <div className="introText">
              welcome to chord buildr<br/>
              use the controls above to get started

            </div>
          </div>
        </>}
      
    </div>
  )
}

function buildChordsFromUrl(state, history, dispatch) {
  var currentCode = getProgressionCode(state)

  var newParams = history.location.search + history.location.hash

  if (!state.building && currentCode !== newParams) {
    console.log("New chord code provided " + currentCode + " vs " + newParams)

    dispatch({
      type: "BUILD_PROG_FROM_CODE",
      payload: newParams
    })
  }
}
