import React, { useReducer, createContext, useEffect } from "react"
import PropTypes from "prop-types"
import { pianoGenerator } from "../../utils/pianoHelper"
import { updateUrlProgressionCode, buildProgFromCode } from "../../utils/chordCodeHandler"
import { getScaleAdjustedNoteLetter } from "../../utils/chordManager"
import {
  transposePianoBoard,
  selectChordKeys
} from "../../utils/chordPianoHandler"
import { updateFlatOrSharpLetter } from "../../utils/chordCodeHandler"

export const STATE_NAME = "PIANO_STATE"

const initialState = {
  history: null,
  previousProgCodes: [],
  currentProgCode: null,
  building: false,
  chordPianoSet: [getChordPiano(0)],
  synth: "p",
  volume: 90
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

export function getProgKey(state) {
  for (let i = 0; i < state.chordPianoSet.length; i++) {
    var chordPiano = state.chordPianoSet[i]
    if (chordPiano.isProgKey) {
      return chordPiano.selectedChord
    }
  }
}

export function setProgKey(state, pianoId) {
  clearProgKey(state)
  var chordPiano = getPianoById(state, pianoId)
  chordPiano.isProgKey = true
}

function getChordPiano(pianoId) {
  var chordPiano = {
    id: pianoId,
    piano: pianoGenerator(),
    selectedKey: { noteLetter: "C", octave: 0 },
    selectedChord: {
      noteLetter: "C",
      type: "",
      octave: 1
    }
  }

  return chordPiano
}

function getKeyRelativeLetter(state, letter) {
  let key = getProgKey(state);

  return getScaleAdjustedNoteLetter(key, letter);
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

  //console.log(action.type)
  //console.log("piano id: " + pianoId)

  if (!pianoId) pianoId = 0

  switch (action.type) {
    case "UPDATE_PIANO":
      //console.log(action.payload)

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
      //console.log(action.payload)

      var originalChordPiano = getPianoById(state, pianoId)

      // adjust the note letter depending on whether we're showing sharps or flats
      action.payload.noteLetter = updateFlatOrSharpLetter(
        originalChordPiano.showFlats,
        action.payload.noteLetter
      )

      if (originalChordPiano) {
        if (originalChordPiano.isProgKey) {
          var newSelectedKey = action.payload

          //console.log("transposing for piano id: " + pianoId)
          transposePianoBoard(
            pianoId,
            state.chordPianoSet,
            originalChordPiano,
            newSelectedKey
          )
        }

        let noteLetter = action.payload.noteLetter
        if (!originalChordPiano.isProgKey) {
          noteLetter = getKeyRelativeLetter(state, action.payload.noteLetter);
        }

        originalChordPiano.selectedKey = action.payload
        originalChordPiano.selectedChord.noteLetter = noteLetter;
        originalChordPiano.selectedChord.octave = action.payload.octave

        originalChordPiano.rendered = false

        selectChordKeys(originalChordPiano)
      } else {
        console.log("Piano not found: " + pianoId)
      }

      updateUrlProgressionCode(state)

      return {
        ...state,
        chordPianoSet: state.chordPianoSet,
        history: state.history
      }

    case "UPDATE_SYNTH":
      state.synth = action.synth
      updateUrlProgressionCode(state)
      console.log(state.synth)
      return {
        ...state,
        synth: state.synth
      }

    case "UPDATE_SYNTH_VOLUME":
      state.volume = action.volume
      updateUrlProgressionCode(state)

      return {
        ...state,
        volume: state.volume
      }

    case "UPDATE_CHORD_TYPE":
      var originalChordPiano = getPianoById(state, pianoId)

      if (originalChordPiano) {
        originalChordPiano.selectedChord.type = action.chordType
        originalChordPiano.rendered = false

        selectChordKeys(originalChordPiano)
      }

      updateUrlProgressionCode(state)

      return {
        ...state,
        chordPianoSet: state.chordPianoSet,
        history: state.history
      }

    case "UPDATE_SLASH_CHORD":
      //console.log(action)

      var chordPiano = getPianoById(state, pianoId)

      if (chordPiano) {
        chordPiano.selectedChord.slash = action.isSlashChord
        chordPiano.selectedChord.slashNote = action.slashNote
      }

      chordPiano.rendered = false

      selectChordKeys(chordPiano)

      updateUrlProgressionCode(state)

      return {
        ...state,
        chordPianoSet: state.chordPianoSet,
        history: state.history
      }

    case "UPDATE_SHOW_FLATS":
      //console.log(action)

      var chordPiano = getPianoById(state, pianoId)

      if (chordPiano) {
        chordPiano.showFlats = action.showFlats

        let newNoteLetter = updateFlatOrSharpLetter(
          chordPiano.showFlats,
          chordPiano.selectedKey.noteLetter
        );

        newNoteLetter = getKeyRelativeLetter(state, newNoteLetter);

        console.log(newNoteLetter)

        chordPiano.selectedKey.noteLetter = newNoteLetter;
        chordPiano.selectedChord.noteLetter = newNoteLetter;
      }

      updateUrlProgressionCode(state)

      return {
        ...state,
        chordPianoSet: state.chordPianoSet,
        history: state.history
      }

    case "ADD_CHORD_PIANO":
      if (action.payload != null) {
        action.payload = null
        var nextChordPianoId = getNextId(state)

        state.chordPianoSet = state.chordPianoSet.concat(
          getChordPiano(nextChordPianoId)
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
      //console.log(action.payload)

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
      if (action.payload != null) {
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

    case "LOAD_PREVIOUS_PROG_CODE":
      if (state.previousProgCodes.length > 0) {
        var lastProgIndex = state.previousProgCodes.length - 1
        var previousProgCode = state.previousProgCodes[lastProgIndex]

        state = buildProgFromCode(state, previousProgCode)

        state.changed = lastProgIndex
        state.previousProgCodes.splice(lastProgIndex, 2)
      }

      return {
        ...state,
        chordPianoSet: state.chordPianoSet,
        history: state.history,
        previousProgCodes: state.previousProgCodes,
        currentProgCode: state.currentProgCode,
        synth: state.synth,
        volume: state.volume
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
