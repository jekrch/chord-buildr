import { AppState } from "../components/context/AppContext"
import { ChordPiano, createChordPiano } from "./chordPianoHandler"
import { parseProgressionCode, parseShareCode, serializeSettingsCode, serializeShareCode } from "../codec"

/**
 * glue between the url codec (src/codec) and the app state: builds chord
 * pianos from a code, and keeps the state's current code and undo history
 * up to date. the store migration (IMPROVEMENT_PLAN.md, phase 3) replaces
 * this with a url sync subscriber
 */

export function getChordPianoSetFromProgCode(progCode: string | null): ChordPiano[] {
  return parseProgressionCode(progCode).map(createChordPiano)
}

/**
 * Builds a progression from a provided code
 * @param state
 * @param code
 * @returns
 */
export function buildProgFromCode(state: AppState, code: string): AppState {
  if (state.building) {
    return state
  }

  try {
    const { settings, chords } = parseShareCode(code)

    // update state with new values
    state.format = settings.format
    if (settings.fretView) state.fretView = settings.fretView
    state.synth = settings.synth
    state.volume = settings.volume
    state.eq = settings.eq

    state.chordPianoSet = chords.map(createChordPiano)
    state.building = false

    updateUrlProgressionCode(state)

    return state
  } catch (error) {
    console.error("error parsing progression code:", error)
    return {
      ...state,
      building: false
    }
  }
}

/**
 * creates a url query string from the current state without escaping characters
 */
export function getStateParamsCode(state: AppState): string {
  return serializeShareCode(state, state.chordPianoSet ?? [])
}

/**
 * Generates a synth code from the current state
 */
export function getSynthCode(state: AppState): string {
  return serializeSettingsCode(state)
}

export function updateUrlProgressionCode(state: AppState): void {
  if (state.building) {
    return
  }

  const progressionCode = getStateParamsCode(state)

  loadProgressionCode(state, progressionCode)
}

function loadProgressionCode(state: AppState, progressionCode: string): void {

  if (progressionCode === state.currentProgCode)
    return;


  if (state.building) {
    state.currentProgCode = progressionCode;
    return;
  }

  if (state.currentProgCode) {
    const prevCodeLength = state.previousProgCodes.length;

    // Only add to history if it's different from the current code
    if (prevCodeLength <= 1) {
      state.previousProgCodes.push(state.currentProgCode);
    } else if (
      state.previousProgCodes[prevCodeLength - 1] !== state.currentProgCode
    ) {
      state.previousProgCodes.push(state.currentProgCode);
    }
  }

  state.currentProgCode = progressionCode;
}
