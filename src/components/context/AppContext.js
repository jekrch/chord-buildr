import React, { useReducer, createContext, useEffect } from "react"
import PropTypes from "prop-types"
import { pianoGenerator } from "../../utils/pianoHelper"

export const STATE_NAME = "PIANO_STATE"

const initialState = {
  chordPianoSet: [getChordPiano(0)]
}

function getChordPiano(index) {
  var chordPiano = {
    index: index,
    piano: pianoGenerator(),
    selectedKey: { noteLetter: "C", noteOctave: 0 },
    selectedChord: {
      noteLetter: "",
      type: "",
      octave: 0
    }
  }

  return chordPiano
}

const persistedState = JSON.parse(sessionStorage.getItem(STATE_NAME))

const finalInitialState = { ...initialState, ...persistedState }

const appReducer = (state, action) => {
  var pianoIndex = action.index

  console.log("piano index: " + pianoIndex)

  if (!pianoIndex) pianoIndex = 0

  switch (action.type) {
    case "UPDATE_PIANO":
      console.log(action.payload)
      return {
        ...state,
        chordPianoSet: state.chordPianoSet.map((chordPiano, i) =>
          i === pianoIndex
            ? { ...chordPiano, piano: action.payload }
            : chordPiano
        )
      }

    case "UPDATE_KEY":
      console.log(action.payload)
      return {
        ...state,
        chordPianoSet: state.chordPianoSet.map((chordPiano, i) =>
          i === pianoIndex
            ? { ...chordPiano, selectedKey: action.payload }
            : chordPiano
        )
      }

    case "UPDATE_CHORD":
      console.log(action.payload)
      return {
        ...state,
        chordPianoSet: state.chordPianoSet.map((chordPiano, i) =>
          i === pianoIndex
            ? { ...chordPiano, selectedChord: action.payload }
            : chordPiano
        )
      }

    case "ADD_CHORD_PIANO":
      var nextChordPianoIndex = state.chordPianoSet.length
      return {
        ...state,
        chordPianoSet: state.chordPianoSet.concat(
          getChordPiano(nextChordPianoIndex)
        )
      }

    default:
      return state
  }
}

export const AppContext = createContext()

export const AppProvider = (props) => {
  const [state, dispatch] = useReducer(appReducer, finalInitialState)

  useEffect(() => {
    sessionStorage.setItem(STATE_NAME, JSON.stringify(state))
  }, [state])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {props.children}
    </AppContext.Provider>
  )
}

AppProvider.propTypes = {
  children: PropTypes.element
}
