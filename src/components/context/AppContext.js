import React, { useReducer, createContext, useEffect } from "react"
import PropTypes from "prop-types"
import { pianoGenerator } from "../../utils/pianoHelper"

export const STATE_NAME = "PIANO_STATE"

const initialState = {
  chordPianoSet: [getChordPiano(0)]
}

/***
 * Gets the next available sequential piano id from the current state
 */
export function getPianoById(state, pianoId) {
  var chordPianoResults = state.chordPianoSet.filter(
    (chordPiano) => chordPiano.id == pianoId
  )

  if (chordPianoResults.length > 0) return chordPianoResults[0]

  return null
}

export function getProgressionCode(state) {
  var code = ""
  for (let i = 0; i < state.chordPianoSet.length; i++) {
    var chordPiano = state.chordPianoSet[i]
    var selectedChord = chordPiano.selectedChord

    if (!selectedChord) continue

    code += "(" + selectedChord.noteLetter + ";"
    code += "" + selectedChord.type + ";"
    code += "" + selectedChord.octave + ");"
  }

  return code
}

function getChordPiano(pianoId) {
  var chordPiano = {
    id: pianoId,
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

function getNextId(state) {
  var nextId = Math.max(
    ...state.chordPianoSet.map((chordPiano) => chordPiano.id)
  )

  if (nextId == null || nextId == -Infinity) return 0

  return nextId + 1
}

const persistedState = JSON.parse(sessionStorage.getItem(STATE_NAME))

const finalInitialState = { ...initialState, ...persistedState }

const appReducer = (state, action) => {
  var pianoid = action.id

  console.log("piano id: " + pianoid)

  if (!pianoid) pianoid = 0

  switch (action.type) {
    case "UPDATE_PIANO":
      console.log(action.payload)
      return {
        ...state,
        chordPianoSet: state.chordPianoSet.map((chordPiano) =>
          chordPiano.id === pianoid
            ? { ...chordPiano, piano: action.payload }
            : chordPiano
        )
      }

    case "UPDATE_KEY":
      console.log(action.payload)
      return {
        ...state,
        chordPianoSet: state.chordPianoSet.map((chordPiano) =>
          chordPiano.id === pianoid
            ? { ...chordPiano, selectedKey: action.payload }
            : chordPiano
        )
      }

    case "UPDATE_CHORD":
      console.log(action.payload)
      return {
        ...state,
        chordPianoSet: state.chordPianoSet.map((chordPiano) =>
          chordPiano.id === pianoid
            ? { ...chordPiano, selectedChord: action.payload }
            : chordPiano
        )
      }

    case "ADD_CHORD_PIANO":
      var nextChordPianoid = getNextId(state) //state.chordPianoSet.length
      return {
        ...state,
        chordPianoSet: state.chordPianoSet.concat(
          getChordPiano(nextChordPianoid)
        )
      }

    case "REMOVE_PIANO":
      return {
        ...state,
        chordPianoSet: state.chordPianoSet.filter(
          (item) => item.id !== action.id
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
