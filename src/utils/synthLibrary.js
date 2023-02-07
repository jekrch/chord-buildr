import * as Tone from "tone"
import { isMobile } from "react-device-detect"

var synth = null
var synthType = null
var baseDecibel = 2

function getPlumberSynth() {
  var synth = new Tone.PolySynth().toDestination()
  return synth
}

function getPiano() {

  var sampler = new Tone.Sampler({
    urls: {
      A0: "A0.mp3",
      C1: "C1.mp3",
      "D#1": "Ds1.mp3",
      "F#1": "Fs1.mp3",
      A1: "A1.mp3",
      C2: "C2.mp3",
      "D#2": "Ds2.mp3",
      "F#2": "Fs2.mp3",
      A2: "A2.mp3",
      C3: "C3.mp3",
      "D#3": "Ds3.mp3",
      "F#3": "Fs3.mp3",
      A3: "A3.mp3",
      C4: "C4.mp3",
      "D#4": "Ds4.mp3",
      "F#4": "Fs4.mp3",
      A4: "A4.mp3",
      C5: "C5.mp3",
      "D#5": "Ds5.mp3",
      "F#5": "Fs5.mp3",
      A5: "A5.mp3",
      C6: "C6.mp3",
      "D#6": "Ds6.mp3",
      "F#6": "Fs6.mp3",
      A6: "A6.mp3",
      C7: "C7.mp3",
      "D#7": "Ds7.mp3",
      "F#7": "Fs7.mp3",
      A7: "A7.mp3",
      C8: "C8.mp3"
    },
    release: 10,
    baseUrl: "https://tonejs.github.io/audio/salamander/",
  }).toDestination();
  return sampler;
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

function getBellsSynth() {
  var synth = new Tone.PolySynth().toDestination()

  var instr = {
    harmonicity: 8,
    modulationIndex: 2,
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 0.001,
      decay: 2,
      sustain: 0.1,
      release: 2
    },
    modulation: {
      type: "square"
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
  } else if (synthType === "b") {
    baseDecibel = -4
    synth = getBellsSynth()
  } else if (synthType === "pi") {
    baseDecibel = 8
    synth = getPiano()
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
  b: "bells",
  pi: "piano",
  pl: "pluck"
}
