const pianoKeys = [
  {
    note: "c",
    color: "white"
  },
  {
    note: "cs",
    color: "black"
  },
  {
    note: "d",
    color: "white"
  },
  {
    note: "ds",
    color: "black"
  },
  {
    note: "e",
    color: "white"
  },
  {
    note: "f",
    color: "white"
  },
  {
    note: "fs",
    color: "black"
  },
  {
    note: "g",
    color: "white"
  },
  {
    note: "gs",
    color: "black"
  },
  {
    note: "a",
    color: "white"
  },
  {
    note: "as",
    color: "black"
  },
  {
    note: "b",
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
