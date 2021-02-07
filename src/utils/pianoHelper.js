const pianoKeys = [
  {
    note: "C",
    color: "white"
  },
  {
    note: "C#",
    color: "black"
  },
  {
    note: "D",
    color: "white"
  },
  {
    note: "D#",
    color: "black"
  },
  {
    note: "E",
    color: "white"
  },
  {
    note: "F",
    color: "white"
  },
  {
    note: "F#",
    color: "black"
  },
  {
    note: "G",
    color: "white"
  },
  {
    note: "G#",
    color: "black"
  },
  {
    note: "A",
    color: "white"
  },
  {
    note: "A#",
    color: "black"
  },
  {
    note: "B",
    color: "white"
  }
]

export const pianoGenerator = () => {
  let piano = []
  let octaves = 3
  for (let i = 0; i < octaves; i++) {
    //i is each octave
    var pianoKeysOctave = []

    for (let z = 0; z < pianoKeys.length; z++) {
      var newKey = {}
      var key = pianoKeys[z]

      newKey.note = key.note
      newKey.color = key.color
      newKey.selected = false
      newKey.noteNumber = z + 1
      newKey.octave = i
      pianoKeysOctave.push(newKey)
    }

    piano.push(pianoKeysOctave)
  }
  return piano
}

// deselect all keys in the provided piano
export function clearPianoSelections(piano) {
  for (let i = 0; i < piano.length; i++) {
    var pianoOctave = piano[i]

    for (let z = 0; z < pianoOctave.length; z++) {
      var key = pianoOctave[z]
      key.selected = false
    }
  }
}
