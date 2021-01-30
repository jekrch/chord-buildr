import React, { useReducer, createContext, useEffect } from "react"
import PropTypes from "prop-types"
import { pianoGenerator } from "../../utils/pianoHelper"

export const STATE_NAME = "PIANO_STATE"

const initialState = {
  history: null,
  building: false,
  chordPianoSet: [getChordPiano(0)]
}

/***
 * Gets the next available sequential piano id from the current state
 */
export function getPianoById(state, pianoId) {
  var chordPianoResults = state.chordPianoSet.filter(
    (chordPiano) => chordPiano.id === pianoId
  )

  if (chordPianoResults.length > 0) return chordPianoResults[0]

  return null
}

export function buildProgFromCode(state, code) {
  if (state.building) return

  var chordArray = code.replace(")", "").split("(")

  var chordPianoSet = []

  state.building = true

  for (let i = 0; i < chordArray.length; i++) {
    var chordCode = chordArray[i]

    if (chordCode === "") continue

    console.log(chordCode)

    var octave = chordCode.substring(0, 1)
    var chord = getChordFromCode(chordCode)

    var chordPiano = {
      id: i,
      piano: pianoGenerator(),
      selectedKey: { noteLetter: chord.noteLetter, noteOctave: octave },
      selectedChord: {
        noteLetter: chord.noteLetter,
        type: chord.type,
        octave: octave
      }
    }

    chordPianoSet.push(chordPiano)
  }

  state.chordPianoSet = chordPianoSet
  state.building = false
  updateUrlProgressionCode(state)

  return state
}

function getChordFromCode(chordCode) {
  var chord = {}

  if (chordCode.substring(2, 3) === "#") {
    chord.noteLetter = chordCode.substring(1, 3)
    chord.type = chordCode.substring(3).replace(")", "")
  } else {
    chord.noteLetter = chordCode.substring(1, 2)
    chord.type = chordCode.substring(2).replace(")", "")
  }
  return chord
}

export function getProgressionCode(state) {
  var code = ""
  for (let i = 0; i < state.chordPianoSet.length; i++) {
    var chordPiano = state.chordPianoSet[i]
    var selectedChord = chordPiano.selectedChord

    if (!selectedChord) continue

    code += "(" + selectedChord.octave + selectedChord.noteLetter
    code += selectedChord.type + ")"
  }

  return code
}

export function updateUrlProgressionCode(state) {
  if (state.building) return

  state.history.push({
    search: "?prog=" + getProgressionCode(state)
  })
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

  if (nextId === null || nextId === -Infinity) return 0

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

      state.chordPianoSet = state.chordPianoSet.map((chordPiano) =>
        chordPiano.id === pianoid
          ? { ...chordPiano, piano: action.payload }
          : chordPiano
      )

      updateUrlProgressionCode(state)

      return {
        ...state,
        chordPianoSet: state.chordPianoSet
      }

    case "UPDATE_KEY":
      console.log(action.payload)

      state.chordPianoSet = state.chordPianoSet.map((chordPiano) =>
        chordPiano.id === pianoid
          ? { ...chordPiano, selectedKey: action.payload }
          : chordPiano
      )

      updateUrlProgressionCode(state)

      return {
        ...state,
        chordPianoSet: state.chordPianoSet
      }

    case "UPDATE_CHORD":
      console.log(action.payload)

      state.chordPianoSet = state.chordPianoSet.map((chordPiano) =>
        chordPiano.id === pianoid
          ? { ...chordPiano, selectedChord: action.payload }
          : chordPiano
      )

      updateUrlProgressionCode(state)

      return {
        ...state,
        chordPianoSet: state.chordPianoSet
      }

    case "ADD_CHORD_PIANO":
      if (action.payload !== null) {
        action.payload = null
        var nextChordPianoid = getNextId(state)

        state.chordPianoSet = state.chordPianoSet.concat(
          getChordPiano(nextChordPianoid)
        )

        updateUrlProgressionCode(state)
      }

      return {
        ...state,
        chordPianoSet: state.chordPianoSet
      }

    case "REMOVE_PIANO":
      state.chordPianoSet = state.chordPianoSet.filter(
        (item) => item.id !== action.id
      )

      updateUrlProgressionCode(state)

      return {
        ...state,
        chordPianoSet: state.chordPianoSet
      }

    case "BUILD_PROG_FROM_CODE":
      if (action.payload !== null) {
        var code = action.payload

        action.payload = null

        state = buildProgFromCode(state, code)
      }

      return {
        ...state,
        chordPianoSet: state.chordPianoSet
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
