import * as Tone from "tone"
import { isMobile } from "react-device-detect"

var synth = null
var synthType = null
var baseDecibel = 2

function getPlumberSynth() {
  var synth = new Tone.PolySynth().toDestination()
  return synth
}

function getWaveSynth() {
  var synth = new Tone.PolySynth().toDestination()
  var filter = new Tone.Vibrato(5, 0.1).toDestination()
  synth.connect(filter)
  return synth
}

function getSwellSynth() {
  var synth = new Tone.PolySynth().toDestination()
  synth.voice = Tone.AMSynth
  return synth
}

function getOrganSynth() {
  var synth = new Tone.PolySynth().toDestination()
  var instr = {
    oscillator: {
      type: "fatcustom",
      partials: [0.7, 1, 0, 0.3, 0.1],
      spread: 10,
      count: 3
    },
    envelope: {
      attack: 0.001,
      decay: 1.6,
      sustain: 0.5,
      release: 1.6
    }
  }
  synth.set(instr)
  return synth
}

function getPluckSynth() {
  var synth = new Tone.PolySynth().toDestination()
  var instr = {
    harmonicity: 8,
    modulationIndex: 6,
    oscillator: {
      type: "sine2"
    },
    envelope: {
      attack: 0.001,
      decay: 2,
      sustain: 0.1,
      release: 2
    },
    modulation: {
      type: "square2"
    },
    modulationEnvelope: {
      attack: 0.002,
      decay: 0.2,
      sustain: 0,
      release: 0.2
    }
  }
  synth.set(instr)

  return synth
}

/***
 * Returns a synth as specified by user volume and voice
 * selections, along with the base decible value (to be
 * modified as determined by the chord)
 */
export function getSynth(state) {
  //console.log(state.synth)

  if (synth != null && synthType == state.synth) {
    return { synth: synth, baseDecibel: baseDecibel }
  }

  synthType = state.synth

  if (synth != null) {
    synth.dispose()
  }

  if (synthType === "w") {
    baseDecibel = -1
    synth = getWaveSynth()
  } else if (synthType === "s") {
    baseDecibel = 16
    synth = getSwellSynth()
  } else if (synthType === "o") {
    baseDecibel = -3
    synth = getOrganSynth()
  } else if (synthType === "pl") {
    baseDecibel = -8
    synth = getPluckSynth()
  } else if (synthType === "p") {
    baseDecibel = 2
    synth = getPlumberSynth()
  }

  if (isMobile) {
    synth.set({ latencyHint: "balanced" })
  }

  return { synth: synth, baseDecibel: baseDecibel }
}

export const synthTypes = {
  p: "plumber",
  w: "wave",
  s: "swell",
  o: "organ",
  pl: "pluck"
}
