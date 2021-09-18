import * as Tone from "tone"
import { getPianoById } from "../components/context/AppContext"
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

function getSynth(state) {
  console.log(state.synth)

  if (synth != null && synthType == state.synth) {
    return synth
  }

  synthType = state.synth

  if (isMobile) {
    synth.set({ latencyHint: "balanced" })
  }

  if (synth != null) {
    synth.dispose()
  }

  if (synthType == "wave") {
    baseDecibel = -1
    synth = getWaveSynth()
  } else if (synthType == "swell") {
    baseDecibel = 16
    synth = getSwellSynth()
  } else if (synthType == "organ") {
    baseDecibel = -3
    synth = getOrganSynth()
  } else if (synthType == "pluck") {
    baseDecibel = -8
    synth = getPluckSynth()
  } else if (synthType == "plumber") {
    baseDecibel = 2
    synth = getPlumberSynth()
  }

  return synth
}

export function playPiano(dispatch, state, pianoId) {
  var pianoComponent = getPianoById(state, pianoId)

  var synth = getSynth(state)

  synth.toDestination()
  var selectedNotes = getSelectedNotes(pianoComponent.piano)

  if (!isMobile) {
    dispatch({
      type: "UPDATE_PIANO",
      id: pianoComponent.id,
      payload: pianoComponent.piano
    })
  }

  synth.releaseAll()

  synth.volume.value = getDecibel(state.volume, pianoComponent.piano)
  console.log("vol: " + synth.volume.value)

  synth.triggerAttackRelease(
    selectedNotes,
    "1.1",
    isMobile ? "+0.15" : "+0.03", // allow more latency on mobile
    "0.7"
  )

  if (!isMobile) clearPianoKeyPlaying(dispatch, pianoComponent)
}

function getSelectedNotes(piano) {
  var selectedNotes = []

  for (let octaveIndex = 0; octaveIndex < piano.length; octaveIndex++) {
    var pianoOctave = piano[octaveIndex]

    for (let j = 0; j < pianoOctave.length; j++) {
      var noteKey = pianoOctave[j]
      if (noteKey.selected) {
        var note = `${noteKey.note.toUpperCase()}${octaveIndex + 3}`
        selectedNotes.push(note)

        if (!isMobile) {
          noteKey.isStopping = null
          noteKey.isPlaying = true
        }
      }
    }
  }

  return selectedNotes
}

/***
 * The decibel should be inversely proportional to the highest note
 */
function getDecibel(userVolume, piano) {
  var userVolumeModifier = getUserVolumeModifier(userVolume)

  var selectedNoteNumbers = []

  for (let octaveIndex = 0; octaveIndex < piano.length; octaveIndex++) {
    var pianoOctave = piano[octaveIndex]

    for (let j = 0; j < pianoOctave.length; j++) {
      var noteKey = pianoOctave[j]

      if (noteKey.selected) {
        var absoluteNoteNumber = noteKey.noteNumber + noteKey.octave * 12
        selectedNoteNumbers.push(absoluteNoteNumber)
      }
    }
  }
  var highestNoteNumber = Math.max.apply(Math, selectedNoteNumbers)

  return baseDecibel - highestNoteNumber / 2.5 + userVolumeModifier
}

function clearPianoKeyPlaying(dispatch, pianoComponent) {
  setTimeout(function () {
    var piano = pianoComponent.piano
    for (let i = 0; i < piano.length; i++) {
      var pianoOctave = piano[i]

      for (let z = 0; z < pianoOctave.length; z++) {
        var key = pianoOctave[z]
        if (key.isPlaying) {
          key.isPlaying = false
          key.isStopping = true
        }
      }
    }

    dispatch({
      type: "UPDATE_PIANO",
      id: pianoComponent.id,
      payload: pianoComponent.piano
    })
  }, 1500)
}

/**
 * Take the userVolume range (0-100) and convert it
 * to a modifier ranging between -20 to 4 with 90 as
 * the 0 point
 * @param {*} userVolume
 * @returns
 */
function getUserVolumeModifier(userVolume) {
  // use 0 if null is passed
  if (userVolume == null) {
    userVolume = 0
  }
  var modifier = 0

  // if the user vol is 90, the modifier should be 0
  // otherwise approach 4
  if (userVolume >= 90) {
    var volIncrease = userVolume - 90

    modifier = modifier + volIncrease * 0.4
  } else {
    // below 90 the modifier should approach -20
    var volDecrease = 90 - userVolume

    modifier = 0 - 20 * (volDecrease / 90)
  }

  console.log("user modifier " + modifier)
  return modifier
}
