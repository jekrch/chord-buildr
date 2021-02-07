import * as Tone from "tone"

const sampler = getSampler()

function getSampler() {
  var sampler = new Tone.Sampler({
    urls: {
      C3: "C3.mp3",
      "D#3": "Ds3.mp3",
      "F#3": "Fs3.mp3",
      A3: "A4.mp3",
      C4: "C4.mp3",
      "D#4": "Ds4.mp3",
      "F#4": "Fs4.mp3",
      A4: "A4.mp3",
      C5: "C5.mp3",
      "D#5": "Ds5.mp3",
      "F#5": "Fs5.mp3",
      A5: "A5.mp3"
    },
    baseUrl: "https://tonejs.github.io/audio/salamander/"
  }).toDestination()

  return sampler
}

export function playPiano(pianoComponent) {
  console.log("play piano " + pianoComponent)
  console.log(pianoComponent)

  var selectedNotes = getSelectedNotes(pianoComponent.piano)

  sampler.triggerAttackRelease(selectedNotes, "1.1", "+0.05", "0.3")

  //synth.triggerAttackRelease(selectedNotes, 0.2)
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
      }
    }
  }

  return selectedNotes
}
