const pianoKeys = [
  {
    note: "c",
    color: "white",
    selected: false
  },
  {
    note: "cs",
    color: "black",
    selected: false
  },
  {
    note: "d",
    color: "white",
    selected: false
  },
  {
    note: "ds",
    color: "black",
    selected: false
  },
  {
    note: "e",
    color: "white",
    selected: false
  },
  {
    note: "f",
    color: "white",
    selected: false
  },
  {
    note: "fs",
    color: "black",
    selected: false
  },
  {
    note: "g",
    color: "white",
    selected: false
  },
  {
    note: "gs",
    color: "black",
    selected: false
  },
  {
    note: "a",
    color: "white",
    selected: false
  },
  {
    note: "as",
    color: "black",
    selected: false
  },
  {
    note: "b",
    color: "white",
    selected: false
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
