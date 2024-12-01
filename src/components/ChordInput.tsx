import { useRef, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import {
  noteLetterMapWithSharps,
  noteLetterMapWithFlats,
  getSharpEquivalent,
  getFlatEquivalent
} from '../utils/noteManager'
import {
  chordMap,
  getScaleAdjustedNoteLetter,
  equalChroma,
  noteIsInScale
} from '../utils/chordManager'
import { selectChordKeys, hasSelectedNotes, ChordPiano, SelectedChord } from '../utils/chordPianoHandler'
import { useAppContext, getPianoById, getProgKeyChord } from './context/AppContext'
import { updateFlatOrSharpLetter } from '../utils/chordCodeHandler'
import { cn } from '../lib/utils'
import { Checkbox } from '../components/ui/checkbox';
import { getChordNumeral } from '../utils/numeralHelper'

interface ChordInputProps {
  pianoComponentId: number,
  className?: string
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

export const ChordInput: React.FC<ChordInputProps> = ({ pianoComponentId, className }: ChordInputProps) => {
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
    if (!noteLetter || !noteLetter.trim()) {
      return 'C'; // Default to C if input is empty/invalid
    }
    const chord: SelectedChord | undefined = getProgKeyChord(state);
    const adjustedLetter = getScaleAdjustedNoteLetter(chord!, noteLetter);
    return adjustedLetter || noteLetter; // Fallback to original letter if adjustment fails
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
    console.log(e.target.value)
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

  const getNumeralChord = (): string => {
    const piano = getPianoById(state, pianoComponentId)
    const key = getProgKeyChord(state)
    return getChordNumeral(key, piano?.selectedChord) ?? ''
  }
  
  return (
    <form className={cn("h-[12em] w-[6em]", className)}>
      <div className="items-center space-y-2 w-full">
        {/* Key Selection */}
        <Select
          value={getKeyRelativeLetter(chordRef.current.selectedChordKey) || 'C'} // Fallback to 'C'
          onValueChange={(value: any) => handleKeySelectChange({ target: { value } } as any)}
        >
          <SelectTrigger className="w-full h-full">
            <span className="w-full"><span className="float-left"> <SelectValue /></span>  <span className="float-right mr-1 text-slate-400">{getNumeralChord()}</span></span>
          </SelectTrigger>
          <SelectContent>
            {chordRef.current.noteArray
              //.filter(option => option && option.trim()) // Remove empty strings first
              .map((option, index) => {
                const relativeValue = getKeyRelativeLetter(option);
                return relativeValue ? ( // Only render if we have a value
                  <SelectItem key={index} value={relativeValue}>
                    {relativeValue}
                  </SelectItem>
                ) : null;
              })
              .filter(Boolean)} {/* Remove any null elements */}
          </SelectContent>
        </Select>
        {/* <div className="pianoRomanNumeral">
        {getNumeralChord()}
        </div> */}
        {/* Chord Type Selection */}
        <Select
          value={chordRef.current.type || 'major'} // Fallback to 'major'
          onValueChange={(value: any) => handleTypeSelectChange({ target: { value } } as any)}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {chordTypeArray
              //.filter(option => option && option.trim()) // Remove empty strings
              .map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {/* Checkboxes */}
        <div className="flex-box space-x-2 text-slate-300">
          <div className="flex space-x-4 mb-2">
            <div className="space-x-2">
              <Checkbox
                id={`key-${chordRef.current.id}`}
                className="pb-[0.1em]"
                checked={chordRef.current.isProgKey}
                onCheckedChange={(checked: any) =>
                  handleIsKeyChecked({ target: { checked } } as any)
                }
              />
              <label
                htmlFor={`key-${chordRef.current.id}`}
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                key
              </label>
            </div>

            <div className="items-center space-x-2">
              <Checkbox
                id={`flat-${chordRef.current.id}`}
                className="pb-[0.1em]"
                checked={chordRef.current.showFlats}
                onCheckedChange={(checked: any) =>
                  handleIsFlatKeyChecked({ target: { checked } } as any)
                }
              />
              <label
                htmlFor={`flat-${chordRef.current.id}`}
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                b
              </label>
            </div>
          </div>

          <div className="flex !ml-0 space-x-2 !mb-[0.7em]">
            <Checkbox
              id={`slash-${chordRef.current.id}`}
              className="pb-[0.1em]"
              checked={chordRef.current.slashChord}
              onCheckedChange={(checked) =>
                handleIsSlashChordChecked({ target: { checked } } as any)
              }
            />
            <label
              htmlFor={`slash-${chordRef.current.id}`}
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              slash
            </label>
          </div>

        </div>

        {/* Slash Chord Section */}
        <div className="flex items-center">
          <span
            className={cn(
              "mx-1 text-lg",
              !chordRef.current.slashChord && "invisible"
            )}
          >
            /
          </span>
          <div className={cn(
            "transition-all ml-1",
            !chordRef.current.slashChord && "invisible w-0",
            chordRef.current.slashChord && "w-20"
          )}>
            <Select
              defaultValue={chordRef.current.slashNote || "placeholder"}
              onValueChange={(value: string) => {
                if (value !== "placeholder") {
                  handleSlashChordNoteChange({ target: { value } } as any)
                }
              }}
              disabled={!chordRef.current.slashChord}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder" disabled>

                </SelectItem>
                {chordRef.current.noteArray
                  .map((option, index) => {
                    const value = option.trim()
                    if (!value || !value?.length) return null // Skip empty values

                    const keyRelativeValue = getKeyRelativeLetter(value)
                    // Skip if the relative value is empty
                    if (!keyRelativeValue) return null

                    if (equalChroma(chordRef.current.slashNote, value)) {
                      const slashNoteValue = getKeyRelativeLetter(chordRef.current.slashNote)
                      // Only render if we have a valid slash note value
                      return slashNoteValue ? (
                        <SelectItem key={index} value={slashNoteValue}>
                          {slashNoteValue}
                        </SelectItem>
                      ) : null
                    }

                    return (
                      <SelectItem key={index} value={keyRelativeValue}>
                        {keyRelativeValue}
                      </SelectItem>
                    )
                  })
                  .filter(Boolean) // Remove null values
                }
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </form>
  )
}