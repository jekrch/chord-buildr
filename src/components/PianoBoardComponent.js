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

  useEffect(() => {
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
  })

  const renderChordPianoSet = () => {
    return state.chordPianoSet.map((chordPiano) => (
      <>
        <ChordPianoComponent
          key={Number(chordPiano.id)}
          className="row chordPianoComponent"
          pianoComponentId={Number(chordPiano.id)}
          history={history}
        />
        <div className="pianoStrip" />
      </>
    ))
  }

  return (
    <>
      <div className="pianoBoard">{renderChordPianoSet()} </div>
    </>
  )
}
