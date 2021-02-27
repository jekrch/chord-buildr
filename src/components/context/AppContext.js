import React, { useReducer, createContext, useEffect } from "react"
import PropTypes from "prop-types"
import { pianoGenerator } from "../../utils/pianoHelper"
import { getProgressionCode } from "../../utils/chordCodeHandler"
import {
  createChordPiano,
  transposePianoBoard
} from "../../utils/chordPianoHandler"

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

export function clearProgKey(state) {
  for (let i = 0; i < state.chordPianoSet.length; i++) {
    var chordPiano = state.chordPianoSet[i]
    chordPiano.isProgKey = false
  }
}

export function setProgKey(state, pianoId) {
  clearProgKey(state)
  var chordPiano = getPianoById(state, pianoId)
  chordPiano.isProgKey = true
}

export function buildProgFromCode(state, code) {
  if (state.building) return

  var chordArray = code.replace(")", "").split("(")

  var chordPianoSet = []

  state.building = true

  var progKeySet = false

  for (let i = 0; i < chordArray.length; i++) {
    var chordCode = chordArray[i]

    if (chordCode === "") continue

    console.log(chordCode)

    var chordPiano = createChordPiano(i, chordCode)

    progKeySet = validateProgKey(chordPiano, progKeySet)

    chordPianoSet.push(chordPiano)
  }

  state.chordPianoSet = chordPianoSet
  state.building = false

  updateUrlProgressionCode(state)

  return state
}

function validateProgKey(chordPiano, progKeySet) {
  // if the prog key is set here, only accept it
  // if we haven't already set the progKey

  if (chordPiano.isProgKey) {
    if (progKeySet) chordPiano.isProgKey = false
    else progKeySet = true
  }
  return progKeySet
}

export function updateUrlProgressionCode(state) {
  if (state.building) return

  var porgressionCode = "?prog=" + getProgressionCode(state)

  state.history.push({
    search: porgressionCode
  })
}

function getChordPiano(pianoId) {
  var chordPiano = {
    id: pianoId,
    piano: pianoGenerator(),
    selectedKey: { noteLetter: "C", octave: 0 },
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
  var pianoId = action.id

  console.log(action.type)
  console.log("piano id: " + pianoId)

  if (!pianoId) pianoId = 0

  switch (action.type) {
    case "UPDATE_PIANO":
      console.log(action.payload)

      state.chordPianoSet = state.chordPianoSet.map((chordPiano) =>
        chordPiano.id === pianoId
          ? { ...chordPiano, piano: action.payload }
          : chordPiano
      )

      return {
        ...state,
        chordPianoSet: state.chordPianoSet,
        history: state.history,
        building: state.building
      }

    case "UPDATE_KEY":
      console.log(action.payload)

      var originalChordPiano = getPianoById(state, pianoId)

      if (originalChordPiano.isProgKey) {
        var newSelectedKey = action.payload

        transposePianoBoard(
          pianoId,
          state.chordPianoSet,
          originalChordPiano,
          newSelectedKey
        )
      }

      originalChordPiano.selectedKey = action.payload

      updateUrlProgressionCode(state)

      return {
        ...state,
        chordPianoSet: state.chordPianoSet,
        history: state.history
      }

    case "UPDATE_CHORD":
      console.log(action.payload)

      var newSelectedKey = {
        noteLetter: action.payload.noteLetter,
        octave: action.payload.octave
      }

      var originalChordPiano = getPianoById(state, pianoId)

      if (originalChordPiano.isProgKey) {
        transposePianoBoard(
          pianoId,
          state.chordPianoSet,
          originalChordPiano,
          newSelectedKey
        )
      }

      // update the chord and selected key
      originalChordPiano.selectedChord = action.payload
      originalChordPiano.selectedKey = newSelectedKey

      updateUrlProgressionCode(state)

      return {
        ...state,
        chordPianoSet: state.chordPianoSet,
        history: state.history
      }

    case "ADD_CHORD_PIANO":
      if (action.payload !== null) {
        action.payload = null
        var nextChordpianoId = getNextId(state)

        state.chordPianoSet = state.chordPianoSet.concat(
          getChordPiano(nextChordpianoId)
        )

        updateUrlProgressionCode(state)
      }

      return {
        ...state,
        chordPianoSet: state.chordPianoSet,
        history: state.history
      }

    case "REMOVE_PIANO":
      state.chordPianoSet = state.chordPianoSet.filter(
        (item) => item.id !== action.id
      )

      updateUrlProgressionCode(state)

      return {
        ...state,
        chordPianoSet: state.chordPianoSet,
        history: state.history
      }

    case "SET_PROG_KEY":
      console.log(action.payload)

      if (action.keyChecked) {
        setProgKey(state, action.id)
      } else {
        var chordPiano = getPianoById(state, action.id)
        chordPiano.isProgKey = false
      }

      updateUrlProgressionCode(state)

      return {
        ...state,
        chordPianoSet: state.chordPianoSet
      }

    case "BUILD_PROG_FROM_CODE":
      if (action.payload !== null) {
        var code = action.payload

        action.payload = null

        buildProgFromCode(state, code)
      }

      return {
        ...state,
        chordPianoSet: state.chordPianoSet,
        history: state.history,
        building: state.building
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
