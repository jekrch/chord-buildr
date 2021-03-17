import React, { useContext, useEffect } from "react"
import "../styles/Piano.css"
import { AppContext } from "../components/context/AppContext"
import { getProgressionCode } from "../utils/chordCodeHandler"
import { ChordPianoComponent } from "../components/ChordPianoComponent"
import { useHistory } from "react-router-dom"

export const PianoBoardComponent = () => {
  const { state, dispatch } = useContext(AppContext)

  const history = useHistory()
  state.history = history

  const [, updateState] = React.useState()
  const forceUpdate = React.useCallback(() => updateState({}), [])

  useEffect(() => {
    //console.log("render")
    forceUpdate()
  }, [state.chordPianoSet, forceUpdate])

  buildChordsFromUrl(state, history, dispatch)

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
      {renderChordPianoSet()}
      <div className="pianoBoardGutter" />
    </div>
  )
}

function buildChordsFromUrl(state, history, dispatch) {
  var currentCode = getProgressionCode(state)

  var newParams = history.location.search.replace("?prog=", "")
  newParams += history.location.hash

  if (!state.building && currentCode !== newParams) {
    console.log("New chord code provided " + currentCode + " vs " + newParams)

    dispatch({
      type: "BUILD_PROG_FROM_CODE",
      payload: newParams
    })
  }
}
