import React, { useRef, useEffect, ReactNode } from 'react'
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
import { isGuitar, UNSUPPORTED_GUITAR_CHORDS } from '../utils/guitarUtil'
//import { Combobox, ComboboxItem } from './Combobox';

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
    //console.log(e.target.value)
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
    //chordPiano.selectedKey.noteLetter = newLetter
    //chordPiano.selectedChord.noteLetter = newLetter

    const selectedKey = {
      noteLetter: newLetter,
      octave: chordPiano.selectedKey.octave ?? 0
    }

    //console.log(newLetter)

    dispatch({
      type: 'UPDATE_KEY',
      id: chordPiano.id,
      payload: selectedKey
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

  const getOptionText = (option: string): ReactNode => {
    
    if (
      isGuitar(state.format) && 
      UNSUPPORTED_GUITAR_CHORDS.includes(option)
    ) {
      return (
        <span className="text-muted-foreground/60">
          {option}
        </span>
      )
    }
    return (<>{option}</>);

  }

  const numeral = getNumeralChord()

  return (
    <form className={cn("chord-form", className)}>
      {/* Key Selection */}
      <div className="chord-form__note relative">
        <Select
          value={getKeyRelativeLetter(chordRef.current.selectedChordKey) || 'C'}
          onValueChange={(value: any) => handleKeySelectChange({ target: { value } } as any)}
        >
          <SelectTrigger className="h-8 px-2.5" aria-label="Root note">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {chordRef.current.noteArray
              .map((option, index) => {
                const relativeValue = getKeyRelativeLetter(option);
                return relativeValue ? (
                  <SelectItem key={index} value={relativeValue}>
                    {relativeValue}
                  </SelectItem>
                ) : null;
              })
              .filter(Boolean)}
          </SelectContent>
        </Select>
        {numeral && (
          <span
            className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground"
            title="Roman numeral in the selected key"
          >
            {numeral}
          </span>
        )}
      </div>

      {/* Chord type, plus the slash bass note beside it */}
      <div className="chord-form__type-row">
        <div className="chord-form__type">
          <Select
            value={chordRef.current.type || 'major'} // Fallback to 'major'
            onValueChange={(value: any) => handleTypeSelectChange({ target: { value } } as any)}
          >
            <SelectTrigger className="h-8 px-2.5" aria-label="Chord type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {chordTypeArray
                .map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {getOptionText(option)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Slash Chord Section */}
        {!isGuitar(state.format) && (
          <div
            className={cn(
              "chord-form__slash flex items-center gap-1",
              !chordRef.current.slashChord && "invisible min-[860px]:hidden"
            )}
          >
            <span className="text-lg leading-none text-muted-foreground" aria-hidden="true">/</span>
            <div className="min-w-0 max-w-[6rem] flex-1">
              <Select
                defaultValue={chordRef.current.slashNote || "placeholder"}
                onValueChange={(value: string) => {
                  if (value !== "placeholder") {
                    handleSlashChordNoteChange({ target: { value } } as any)
                  }
                }}
                disabled={!chordRef.current.slashChord}
              >
                <SelectTrigger className="h-8 px-2" aria-label="Bass note">
                  <SelectValue placeholder="Bass">{chordRef.current.slashNote}</SelectValue>
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
                  }
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Checkboxes */}
      <div className="chord-form__options flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <ChordOption
          id={`key-${chordRef.current.id}`}
          label="Key"
          title="Use this chord as the progression key"
          checked={chordRef.current.isProgKey}
          onCheckedChange={(checked: any) =>
            handleIsKeyChecked({ target: { checked } } as any)
          }
        />
        <ChordOption
          id={`flat-${chordRef.current.id}`}
          label={"\u266D"}
          title="Show flats"
          checked={chordRef.current.showFlats}
          onCheckedChange={(checked: any) =>
            handleIsFlatKeyChecked({ target: { checked } } as any)
          }
        />
        {!isGuitar(state.format) && (
          <ChordOption
            id={`slash-${chordRef.current.id}`}
            label="Slash"
            title="Add a bass note"
            checked={chordRef.current.slashChord}
            onCheckedChange={(checked) =>
              handleIsSlashChordChecked({ target: { checked } } as any)
            }
          />
        )}
      </div>
    </form>
  )
}

interface ChordOptionProps {
  id: string
  label: string
  title: string
  checked: boolean
  onCheckedChange: (checked: boolean | 'indeterminate') => void
}

const ChordOption: React.FC<ChordOptionProps> = ({ id, label, title, checked, onCheckedChange }) => (
  <div className="inline-flex items-center gap-1.5" title={title}>
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
    />
    <label
      htmlFor={id}
      className="cursor-pointer select-none text-sm leading-none text-muted-foreground transition-colors hover:text-foreground peer-data-[state=checked]:text-foreground"
    >
      {label}
    </label>
  </div>
)
