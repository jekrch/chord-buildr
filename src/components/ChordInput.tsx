import { useRef, useEffect } from 'react'
import Form from 'react-bootstrap/Form'
import {
  noteLetterMapWithSharps,
  noteLetterMapWithFlats,
  getSharpEquivalent,
  getFlatEquivalent
  // @ts-ignore
} from '../utils/noteManager'
import { 
  chordMap, 
  getScaleAdjustedNoteLetter, 
  equalChroma, 
  noteIsInScale 
  // @ts-ignore
} from '../utils/chordManager'
import { selectChordKeys, hasSelectedNotes, ChordPiano, SelectedChord } from '../utils/chordPianoHandler'
import { useAppContext, getPianoById, getProgKeyChord } from './context/AppContext'
import { updateFlatOrSharpLetter } from '../utils/chordCodeHandler'


interface ChordInputProps {
  pianoComponentId: number
}

interface ChordRef {
  showFlats: boolean
  isProgKey: boolean
  selectedChordKey: string
  type: string
  id: number
  slashChord: boolean
  slashNote: string
  noteArray: string[]
}

export const ChordInput: React.FC<ChordInputProps> = ({ pianoComponentId }: ChordInputProps) => {
  const { state, dispatch } = useAppContext()
  const chordRef = useRef<ChordRef>({} as ChordRef)

  const chordPiano: ChordPiano = getPianoById(state, pianoComponentId)!

  chordRef.current.showFlats = showFlats(chordPiano)
  chordRef.current.isProgKey = chordPiano.isProgKey ?? false

  chordRef.current.selectedChordKey = updateFlatOrSharpLetter(
    chordRef.current.showFlats,
    chordPiano.selectedKey.noteLetter ?? 'C'
  )

  chordRef.current.type = chordPiano.selectedChord.type ?? ""
  chordRef.current.id = chordPiano.id
  chordRef.current.slashChord = chordPiano.selectedChord.slash ?? false

  chordRef.current.slashNote = updateFlatOrSharpLetter(
    chordRef.current.showFlats,
    chordPiano.selectedChord.slashNote ?? ''
  )

  chordRef.current.noteArray = getNoteArray(
    chordRef.current.showFlats, 
    chordPiano.selectedKey.noteLetter, 
    chordPiano.selectedChord.slashNote ?? ""
  )

  /**
   * returns a note array for selection in chord letter or slash letter dropdowns
   * takes into account the current key, but doesn't coerce the current selection 
   * if no key is selected. e.g. if no key is selected and user chose b# instead 
   * of c, preserves that letter choice
   */
  function getNoteArray(
    showFlats: boolean, 
    noteLetter?: string, 
    slashNote?: string
  ): string[] {
    let notes = Object.values(noteLetterMapWithSharps) as string[]

    if (showFlats && !noteLetter?.startsWith('#')) {
      notes = Object.values(noteLetterMapWithFlats)
    } 

    const chord: SelectedChord | undefined = getProgKeyChord(state)

    if (chord) {
      notes = notes.map(n => getScaleAdjustedNoteLetter(chord, n) as string)
    }

    if (
      !chord ||
      !noteIsInScale(chord, noteLetter!) ||
      !noteIsInScale(chord, slashNote!)
    ) {
      return notes.map(n => {
        if (equalChroma(n, noteLetter!)) {
          return noteLetter ?? ""
        }
        
        if (equalChroma(n, slashNote!)) {
          return slashNote ?? ""
        }
        
        return n
      })
    }

    return notes
  }

  function getKeyRelativeLetter(noteLetter: string): string {
    const chord: SelectedChord | undefined = getProgKeyChord(state)
    return getScaleAdjustedNoteLetter(chord!, noteLetter)
  }

  useEffect(() => {
    // load selected chord if no keys are selected
    if (!hasSelectedNotes(chordPiano.piano!)) {
      selectChordKeys(chordPiano)
    }

    if (!state.building) {
      selectChordKeys(chordPiano)
    }
  })

  const handleKeySelectChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    if (!e.target.value) return

    chordRef.current.noteArray = getNoteArray(chordRef.current.showFlats, e.target.value)
    const newLetter = getKeyRelativeLetter(e.target.value)
    updateChordPianoKey(chordPiano, newLetter)
  }

  const handleTypeSelectChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    chordRef.current.type = e.target.value

    dispatch({
      type: 'UPDATE_CHORD_TYPE',
      id: chordPiano.id,
      chordType: chordRef.current.type
    })
  }

  const handleIsKeyChecked = (e: React.ChangeEvent<HTMLInputElement>): void => {
    dispatch({
      type: 'SET_PROG_KEY',
      keyChecked: e.target.checked,
      id: chordPiano.id
    })

    updateChordLettersGivenKey(chordPiano)
  }

  const handleIsSlashChordChecked = (e: React.ChangeEvent<HTMLInputElement>): void => {
    chordRef.current.slashChord = e.target.checked
    
    if (!chordRef.current.slashChord) {
      chordRef.current.slashNote = "";
    }

    dispatch({
      type: 'UPDATE_SLASH_CHORD',
      isSlashChord: chordRef.current.slashChord,
      id: chordPiano.id,
      slashNote: chordRef.current.slashNote
    })
  }

  /**
   * updates whether note selector shows sharps or flats
   */
  const handleIsFlatKeyChecked = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const showFlats = e.target.checked
    const currentLetter = chordRef.current.selectedChordKey
    
    chordRef.current.showFlats = showFlats

    dispatch({
      type: 'UPDATE_SHOW_FLATS',
      showFlats: chordRef.current.showFlats,
      id: chordPiano.id
    })
    
    // if this is the prog key, get the intended letter based on the selection and 
    // directly set the prog key to that letter. e.g. if this is the prog key and its
    // currently set to A# and the user chose to show flats, update this chord piano 
    // to Bb and update the other chord piano letters accordingly  
    if (chordRef.current.isProgKey && currentLetter.length >= 2) {
      let newLetter: string | undefined

      if (currentLetter.endsWith('b') && !showFlats) {
        newLetter = getSharpEquivalent(currentLetter)
      } else if (currentLetter.includes('#') && showFlats) {
        newLetter = getFlatEquivalent(currentLetter)
      }
 
      if (newLetter) {
        updateChordPianoKey(chordPiano, newLetter)
      }
    }    
  }

  /**
   * updates the chordPiano to the provided letter
   * if this is current progression key, updates all other chord pianos 
   * to display correct corresponding letter
   */
  function updateChordPianoKey(chordPiano: ChordPiano, newLetter: string): void {
    chordPiano.selectedKey.noteLetter = newLetter
    chordPiano.selectedChord.noteLetter = newLetter

    dispatch({
      type: 'UPDATE_KEY',
      id: chordPiano.id,
      payload: {
        noteLetter: newLetter,
        octave: chordPiano.selectedKey.octave ?? 0
      }
    })
  
    if (chordPiano.isProgKey) {
      updateChordLettersGivenKey(chordPiano)
    }
  }

  const handleSlashChordNoteChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    if (!e.target.value) return
    updateSlashNote(chordPiano, e.target.value)
  }

  function updateSlashNote(chordPiano: ChordPiano, newSlashLetter: string): void {
    if (!newSlashLetter) return

    chordRef.current.slashNote = newSlashLetter
  
    dispatch({
      type: 'UPDATE_SLASH_CHORD',
      isSlashChord: chordRef.current.slashChord,
      slashNote: chordRef.current.slashNote,
      id: chordPiano.id
    })
  }

  const chordTypeArray = Object.keys(chordMap)

  /**
   * updates all chord pianos to correspond with the key of provided chordPiano
   * e.g. if keyChordPiano is f major and another piano is a#, changes to bb
   */
  function updateChordLettersGivenKey(keyChordPiano: ChordPiano): void {
    const key = keyChordPiano.selectedChord

    for (const chordPiano of state.chordPianoSet!) {
      if (chordPiano.id !== keyChordPiano.id) {
        alignChordLetterWithKey(key, chordPiano)
      }

      if (chordPiano.selectedChord.slash) {
        const slashLetter = chordPiano.selectedChord.slashNote
        alignSlashNoteWithKey(key, slashLetter ?? "", chordPiano)
      }
    }
  }

  /**
   * updates chordPiano's slash note to align with provided key if needed
   */
  function alignSlashNoteWithKey(
    key: SelectedChord, 
    slashLetter: string | undefined, 
    chordPiano: ChordPiano
  ): void {
    if (!slashLetter || !noteIsInScale(key, slashLetter)) return

    const newLetter = getScaleAdjustedNoteLetter(key, slashLetter)

    if (newLetter !== slashLetter) {
      chordPiano.selectedChord.slashNote = newLetter

      dispatch({
        type: 'UPDATE_SLASH_CHORD',
        isSlashChord: true,
        slashNote: newLetter,
        id: chordPiano.id
      })
    }
  }

  /**
   * updates chordPiano's note letter to align with provided key if needed
   */
  function alignChordLetterWithKey(key: SelectedChord, chordPiano: ChordPiano): void {
    const chordLetter = chordPiano.selectedChord.noteLetter!
  
    if (noteIsInScale(key, chordLetter)) {
      const newLetter = getScaleAdjustedNoteLetter(key, chordLetter)
  
      if (newLetter !== chordLetter) {
        chordPiano.selectedKey.noteLetter = newLetter
        chordPiano.selectedChord.noteLetter = newLetter

        dispatch({
          type: 'UPDATE_KEY',
          id: chordPiano.id,
          payload: {
            noteLetter: newLetter,
            octave: chordPiano.selectedKey.octave ?? 0
          }
        })
      }
    }
  }

  function showFlats(chordPiano: ChordPiano): boolean {
    return Boolean(
      chordPiano.showFlats ||
      chordPiano.selectedKey.noteLetter.includes('b') ||
      (
        chordPiano.selectedChord.slashNote != null &&
        chordPiano.selectedChord.slashNote.includes('b')
      )
    )
  }

  return (
    <Form className="chordInputForm">
      <Form.Group controlId="chordSelection">
        <div className="chordInputSelection keySelection">
          <Form.Control
            as="select"
            value={getKeyRelativeLetter(chordRef.current.selectedChordKey)}
            custom
            className="selectorBox"
            onChange={handleKeySelectChange}
          >
            {chordRef.current.noteArray.map((option, index) => {
              option = getKeyRelativeLetter(option)
              return (
                <option key={index} value={option}>
                  {option}
                </option>
              )
            })}
          </Form.Control>
        </div>

        <div className="chordInputSelection typeSelection">
          <Form.Control
            className="selectorBox"
            as="select"
            value={chordRef.current.type}
            custom
            onChange={handleTypeSelectChange}
          >
            {chordTypeArray.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </Form.Control>
        </div>

        <Form.Check
          type="checkbox"
          key={Number(chordRef.current.id)}
          label="key"
          checked={chordRef.current.isProgKey}
          className="keyCheckBox chordCheckBox"
          onChange={handleIsKeyChecked}
        />

        <Form.Check
          type="checkbox"
          key={`slash${chordRef.current.id}`}
          label="slash"
          checked={chordRef.current.slashChord}
          className="slashCheckBox chordCheckBox"
          onChange={handleIsSlashChordChecked}
        />

        <Form.Check
          type="checkbox"
          key={`flat${chordRef.current.id}`}
          label="b"
          checked={chordRef.current.showFlats}
          className="flatCheckBox chordCheckBox"
          onChange={handleIsFlatKeyChecked}
        />

        <div className="slashSelection">
          <div
            className="slashSymbol"
            display-option={`${chordRef.current.slashChord}`}
          >
            {'/'}
          </div>
          <div
            className="slashChordSelection"
            display-option={`${chordRef.current.slashChord}`}
          >
            <Form.Control
              className="selectorBox slashSelectorBox"
              as="select"
              value={getKeyRelativeLetter(chordRef.current.slashNote)}
              custom
              onChange={handleSlashChordNoteChange}
            > 
              {chordRef.current.noteArray.concat('').map((option, index) => {
                if (equalChroma(chordRef.current.slashNote, option)) {
                  option = chordRef.current.slashNote
                  option = getKeyRelativeLetter(option)
                }
                
                return (
                  <option key={index} value={option}>
                    {option}
                  </option>
                )
              })}
            </Form.Control>
          </div>
        </div>
      </Form.Group>
    </Form>
  )
}