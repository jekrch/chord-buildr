import React, { ReactNode } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import {
  noteLetterMapWithSharps,
  noteLetterMapWithFlats,
  updateFlatOrSharpLetter
} from '../utils/noteManager'
import {
  chordMap,
  getScaleAdjustedNoteLetter,
  equalChroma,
  noteIsInScale
} from '../utils/chordManager'
import { SelectedChord } from '../utils/chordPianoHandler'
import { useActions, useChord, useFormat, useKeyChord } from '../store/progressionStore'
import { showsFlats } from '../store/progressionEdits'
import { cn } from '../lib/utils'
import { Checkbox } from '../components/ui/checkbox';
import { getChordNumeral } from '../utils/numeralHelper'
import { isSlashNoteMissing, UNSUPPORTED_GUITAR_CHORDS } from '../utils/guitarUtil'
import { isGuitar } from '../utils/settings'
import { useInstrument } from '../utils/instruments'

interface ChordInputProps {
  pianoComponentId: number,
  className?: string
}

const chordTypeArray = Object.keys(chordMap)

/**
 * returns a note array for selection in chord letter or slash letter dropdowns
 * takes into account the current key, but doesn't coerce the current selection
 * if no key is selected. e.g. if no key is selected and user chose b# instead
 * of c, preserves that letter choice
 */
function getNoteArray(
  keyChord: SelectedChord | undefined,
  showFlats: boolean,
  noteLetter?: string,
  slashNote?: string
): string[] {
  let notes = Object.values(noteLetterMapWithSharps) as string[]

  if (showFlats && !noteLetter?.startsWith('#')) {
    notes = Object.values(noteLetterMapWithFlats)
  }

  if (keyChord) {
    notes = notes.map(n => getScaleAdjustedNoteLetter(keyChord, n) as string)
  }

  if (
    !keyChord ||
    !noteIsInScale(keyChord, noteLetter!) ||
    !noteIsInScale(keyChord, slashNote!)
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

/**
 * the chord's controls: root, type, bass note, and whether it's the key,
 * spelled with flats or a slash chord. what a change does to the rest of
 * the progression (transposing, respelling for the key) is the store's
 * business, see progressionEdits
 */
export const ChordInput: React.FC<ChordInputProps> = ({ pianoComponentId, className }: ChordInputProps) => {
  const chordPiano = useChord(pianoComponentId)
  const keyChord = useKeyChord()
  const format = useFormat()
  // undefined for piano, and while the guitar or ukulele shapes load
  const instrument = useInstrument(format)
  const {
    setChordRoot,
    setChordType,
    setProgKey,
    setSlashChord,
    setSlashNote,
    setShowFlats
  } = useActions()

  if (!chordPiano) return null

  const { id, selectedChord } = chordPiano
  const flats = showsFlats(chordPiano)
  const isProgKey = chordPiano.isProgKey ?? false
  const selectedChordKey = updateFlatOrSharpLetter(flats, selectedChord.noteLetter ?? 'C')
  const type = selectedChord.type ?? ""
  const slashChord = selectedChord.slash ?? false
  const slashNote = updateFlatOrSharpLetter(flats, selectedChord.slashNote ?? '')
  const noteArray = getNoteArray(keyChord, flats, selectedChord.noteLetter, selectedChord.slashNote ?? "")

  function getKeyRelativeLetter(noteLetter: string): string {
    if (!noteLetter || !noteLetter.trim()) {
      return 'C'; // Default to C if input is empty/invalid
    }
    const adjustedLetter = getScaleAdjustedNoteLetter(keyChord, noteLetter);
    return adjustedLetter || noteLetter; // Fallback to original letter if adjustment fails
  }

  const handleKeySelectChange = (value: string): void => {
    if (!value) return
    setChordRoot(id, getKeyRelativeLetter(value))
  }

  const handleSlashChordNoteChange = (value: string): void => {
    if (!value) return
    setSlashNote(id, value)
  }

  const numeral = getChordNumeral(keyChord, selectedChord) ?? ''

  const getOptionText = (option: string): ReactNode => {
    if (
      isGuitar(format) &&
      UNSUPPORTED_GUITAR_CHORDS[format]?.includes(option)
    ) {
      return (
        <span className="text-muted-foreground/60">
          {option}
        </span>
      )
    }
    return (<>{option}</>);

  }

  /**
   * a bass note the chord has no guitar or ukulele voicing over is shaded,
   * like an unsupported chord type: its diagram shows the chord without it
   */
  const getSlashNoteText = (note: string): ReactNode =>
    instrument && isSlashNoteMissing(selectedChord, note, format, instrument)
      ? <span className="text-muted-foreground/60">{note}</span>
      : note

  return (
    <form className={cn("chord-form", className)}>
      {/* Key Selection */}
      <div className="chord-form__note relative">
        <Select
          value={getKeyRelativeLetter(selectedChordKey) || 'C'}
          onValueChange={handleKeySelectChange}
        >
          <SelectTrigger className="h-8 px-2.5" aria-label="Root note">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {noteArray
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
            value={type || 'major'} // Fallback to 'major'
            onValueChange={(value: string) => setChordType(id, value)}
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
        <div
          className={cn(
            "chord-form__slash flex items-center gap-1",
            // narrow piano cards keep the bass note's cell so the controls
            // don't shift when it's switched on; guitar cards drop it
            !slashChord &&
              (isGuitar(format) ? "hidden" : "invisible min-[860px]:hidden")
          )}
        >
          <span className="text-lg leading-none text-muted-foreground" aria-hidden="true">/</span>
          <div className="min-w-0 max-w-[6rem] flex-1">
            <Select
              defaultValue={slashNote || "placeholder"}
              onValueChange={(value: string) => {
                if (value !== "placeholder") {
                  handleSlashChordNoteChange(value)
                }
              }}
              disabled={!slashChord}
            >
              <SelectTrigger className="h-8 px-2" aria-label="Bass note">
                <SelectValue placeholder="Bass">
                  {slashNote ? getSlashNoteText(slashNote) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder" disabled>

                </SelectItem>
                {noteArray
                  .map((option, index) => {
                    const value = option.trim()
                    if (!value || !value?.length) return null // Skip empty values

                    const keyRelativeValue = getKeyRelativeLetter(value)
                    // Skip if the relative value is empty
                    if (!keyRelativeValue) return null

                    if (equalChroma(slashNote, value)) {
                      const slashNoteValue = getKeyRelativeLetter(slashNote)
                      // Only render if we have a valid slash note value
                      return slashNoteValue ? (
                        <SelectItem key={index} value={slashNoteValue}>
                          {getSlashNoteText(slashNoteValue)}
                        </SelectItem>
                      ) : null
                    }

                    return (
                      <SelectItem key={index} value={keyRelativeValue}>
                        {getSlashNoteText(keyRelativeValue)}
                      </SelectItem>
                    )
                  })
                }
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="chord-form__options flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <ChordOption
          id={`key-${id}`}
          label="Key"
          title="Use this chord as the progression key"
          checked={isProgKey}
          onCheckedChange={(checked) => setProgKey(id, checked === true)}
        />
        <ChordOption
          id={`flat-${id}`}
          label={"\u266D"}
          title="Show flats"
          checked={flats}
          onCheckedChange={(checked) => setShowFlats(id, checked === true)}
        />
        <ChordOption
          id={`slash-${id}`}
          label="Slash"
          title="Add a bass note"
          checked={slashChord}
          onCheckedChange={(checked) => setSlashChord(id, checked === true)}
        />
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
