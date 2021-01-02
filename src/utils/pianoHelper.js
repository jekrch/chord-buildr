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
    piano.push(pianoKeys)
  }
  return piano
}
