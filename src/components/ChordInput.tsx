import React, { ReactNode } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { updateFlatOrSharpLetter } from '../utils/noteManager'
import { chordMap } from '../utils/chordManager'
import { useActions, useChord, useFormat, useKeyChord } from '../store/progressionStore'
import { showsFlats } from '../store/progressionEdits'
import { cn } from '../lib/utils'
import { Checkbox } from '../components/ui/checkbox'
import { getChordNumeral } from '../utils/numeralHelper'
import { isSlashNoteMissing, UNSUPPORTED_GUITAR_CHORDS } from '../utils/guitarUtil'
import { isGuitar } from '../utils/settings'
import { useInstrument } from '../utils/instruments'
import { getNoteOptions, getRootOptions, getSlashOptions, spellForKey } from '../utils/noteOptions'

interface ChordInputProps {
  pianoComponentId: number,
  className?: string
}

const chordTypes = Object.keys(chordMap)

// the bass note menu's value while there's no bass note
const NO_BASS = "placeholder"

// a choice the chosen instrument can't voice is shaded rather than hidden
const Unsupported: React.FC<{ children: ReactNode }> = ({ children }) => (
  <span className="text-muted-foreground/60">{children}</span>
)

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
  const root = updateFlatOrSharpLetter(flats, selectedChord.noteLetter ?? 'C')
  const type = selectedChord.type || 'major'
  const slashChord = selectedChord.slash ?? false
  const slashNote = updateFlatOrSharpLetter(flats, selectedChord.slashNote ?? '')
  const noteOptions = getNoteOptions(keyChord, flats, selectedChord.noteLetter, selectedChord.slashNote ?? "")
  const numeral = getChordNumeral(keyChord, selectedChord) ?? ''

  const typeText = (option: string): ReactNode =>
    isGuitar(format) && UNSUPPORTED_GUITAR_CHORDS[format]?.includes(option)
      ? <Unsupported>{option}</Unsupported>
      : option

  /**
   * a bass note the chord has no guitar or ukulele voicing over is shaded,
   * like an unsupported chord type: its diagram shows the chord without it
   */
  const slashNoteText = (note: string): ReactNode =>
    instrument && isSlashNoteMissing(selectedChord, note, format, instrument)
      ? <Unsupported>{note}</Unsupported>
      : note

  return (
    <form className={cn("chord-form", className)}>
      <div className="chord-form__note relative">
        <Select
          value={spellForKey(keyChord, root)}
          onValueChange={(value: string) => {
            if (value) setChordRoot(id, spellForKey(keyChord, value))
          }}
        >
          <SelectTrigger className="h-8 px-2.5" aria-label="Root note">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getRootOptions(keyChord, noteOptions).map((option, index) => (
              <SelectItem key={index} value={option}>
                {option}
              </SelectItem>
            ))}
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

      {/* chord type, plus the slash bass note beside it */}
      <div className="chord-form__type-row">
        <div className="chord-form__type">
          <Select
            value={type}
            onValueChange={(value: string) => setChordType(id, value)}
          >
            <SelectTrigger className="h-8 px-2.5" aria-label="Chord type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {chordTypes.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {typeText(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
              // follows the chord, so a transpose or an undo moves the
              // menu's checked note along with the label
              value={slashNote ? spellForKey(keyChord, slashNote) : NO_BASS}
              onValueChange={(value: string) => {
                if (value && value !== NO_BASS) setSlashNote(id, value)
              }}
              disabled={!slashChord}
            >
              <SelectTrigger className="h-8 px-2" aria-label="Bass note">
                <SelectValue placeholder="Bass">
                  {slashNote ? slashNoteText(slashNote) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_BASS} disabled>

                </SelectItem>
                {getSlashOptions(keyChord, noteOptions, slashNote).map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {slashNoteText(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

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
          label={"♭"}
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
