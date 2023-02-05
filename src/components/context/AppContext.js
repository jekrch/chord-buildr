import React, { useReducer, createContext, useEffect } from "react"
import PropTypes from "prop-types"
import { pianoGenerator } from "../../utils/pianoHelper"
import { getProgressionCode } from "../../utils/chordCodeHandler"
import {
  createChordPiano,
  transposePianoBoard,
  selectChordKeys
} from "../../utils/chordPianoHandler"
import { updateFlatOrSharpLetter } from "../../utils/chordCodeHandler"
import { synthTypes } from "../../utils/synthLibrary"

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

export function setProgKey(state, pianoId) {
  clearProgKey(state)
  var chordPiano = getPianoById(state, pianoId)
  chordPiano.isProgKey = true
}

export function getQueryStringParams(query) {
  return query
    ? (/^[?]/.test(query) ? query.slice(1) : query)
        .split("&")
        .reduce((params, param) => {
          let [key, value] = param.split("=")
          params[key] = value
            ? decodeURIComponent(value.replace(/\+/g, " "))
            : ""
          return params
        }, {})
    : {}
}

export function buildProgFromCode(state, code) {
  if (state.building) {
    return
  }

  console.log(code)

  if (code.includes("%")) {
    code = decodeURIComponent(code)
  }

  var params = getQueryStringParams(code)

  //console.log(params)

  var progCode = params.prog != null ? params.prog : params.p

  var synthSettings = getSynthCode(params.s)

  //console.log(progCode)
  //state.building = true
  state.synth = synthSettings.type
  state.volume = synthSettings.volume
  state.chordPianoSet = getChordPianoSetFromProgCode(progCode)
  state.building = false

  updateUrlProgressionCode(state)

  return state
}

/**
 * get a synth settings obj from url code (e.g. pl:100)
 * @param {*} synthCode
 * @returns
 */
function getSynthCode(synthCode) {
  // init with default synth values
  var synth = {
    volume: 90,
    type: "p"
  }

  if (synthCode != null) {
    var codeSplit = synthCode.split(":")

    if (synthCode.split(":").length != 2) {
      return synth
    }

    var type = codeSplit[0]
    var volume = codeSplit[1]

    if (Object.keys(synthTypes).includes(type)) {
      synth.type = type
    }

    if (volume != null && volume >= 0 && volume <= 100) {
      synth.volume = volume
    }
  }

  return synth
}

function getChordPianoSetFromProgCode(progCode) {
  if (progCode == null) return []

  var chordArray = progCode.split(")")

  var chordPianoSet = []

  var progKeySet = false

  for (let i = 0; i < chordArray.length; i++) {
    var chordCode = chordArray[i]

    if (chordCode === "") continue

    var chordPiano = createChordPiano(i, chordCode)

    if (!chordPiano) continue

    progKeySet = validateProgKey(chordPiano, progKeySet)

    chordPianoSet.push(chordPiano)
  }

  return chordPianoSet
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
  if (state.building) {
    return
  }
  var progressionCode = getProgressionCode(state)
  //var progressionCodeUrl = "?prog=" + progressionCode

  if (state.currentProgCode) state.previousProgCodes.push(state.currentProgCode)

  state.currentProgCode = progressionCode

  state.history.push({
    search: progressionCode
  })
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

        originalChordPiano.selectedKey = action.payload
        originalChordPiano.selectedChord.noteLetter = action.payload.noteLetter
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

        chordPiano.selectedKey.noteLetter = updateFlatOrSharpLetter(
          chordPiano.showFlats,
          chordPiano.selectedKey.noteLetter
        )

        chordPiano.selectedChord.noteLetter = chordPiano.selectedKey.noteLetter
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

        console.log("previous: " + previousProgCode)
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
