import React, { useLayoutEffect, useRef } from "react"
import Chord from "@techies23/react-chords"
import { ChordPiano, SelectedChord, getChordNotes } from "../utils/chordPianoHandler"
import { getChordDisplay, isSlashChord } from "../utils/chordCodeHandler"
import { getChordChart, isGuitar } from "../utils/guitarUtil"
import { getSections } from "../utils/sectionBreaks"
import { cn } from "../lib/utils"

// "chords" is just the names, written out in bars; "diagrams" puts each
// name over its tab (guitar, ukulele) or keys (piano)
export type SheetMode = "chords" | "diagrams"
export type SheetTheme = "light" | "dark"

export interface SheetSectionText {
  label: string
  note: string
}

export interface SheetText {
  title: string
  subtitle: string
  // by section index, so labels stay put when chords inside one change
  sections: SheetSectionText[]
  notes: string
}

const INSTRUMENT_NAMES: Record<string, string> = { p: "Piano", g: "Guitar", u: "Ukulele" }

// typeset accidentals: the root's # or b, and #/b before a degree (b5, #9)
const prettyRoot = (letter = ""): string =>
  letter.charAt(0) + letter.slice(1).replace("#", "♯").replace("b", "♭")
const prettyType = (type = ""): string =>
  type.replace(/#/g, "♯").replace(/b(?=\d)/g, "♭")

/**
 * a chord written the way a lead sheet would: the root, its quality set
 * smaller and raised, then any bass note
 */
const ChordName: React.FC<{ chord: SelectedChord; className?: string }> = ({ chord, className }) => (
  <span className={cn("sheet-chord", className)} aria-label={getChordDisplay(chord)}>
    <span aria-hidden="true">{prettyRoot(chord.noteLetter)}</span>
    {chord.type ? <span className="sheet-chord__type" aria-hidden="true">{prettyType(chord.type)}</span> : null}
    {isSlashChord(chord) ? (
      <span className="sheet-chord__bass" aria-hidden="true">/{prettyRoot(chord.slashNote ?? "")}</span>
    ) : null}
  </span>
)

/**
 * the keys the chord's piano has down, as semitones above its lowest C.
 * a piano that hasn't drawn its chord yet (e.g. one only ever shown as a
 * guitar card) gets the voicing worked out the same way the piano would
 */
function getPianoNotes(chordPiano: ChordPiano): number[] {
  if (chordPiano.rendered && chordPiano.piano) {
    const selected = chordPiano.piano.flatMap((octave, i) =>
      octave.filter((key) => key.selected).map((key) => i * 12 + key.noteNumber - 1)
    )
    if (selected.length) return selected
  }
  const { notes, octave } = getChordNotes(chordPiano.selectedChord, true)
  return notes.map((note) => octave * 12 + note - 1)
}

const WHITE_SEMITONES = [0, 2, 4, 5, 7, 9, 11]
// each black key sits on the line after this many white keys in its octave
const BLACK_KEYS: { semitone: number; after: number }[] = [
  { semitone: 1, after: 1 },
  { semitone: 3, after: 2 },
  { semitone: 6, after: 4 },
  { semitone: 8, after: 5 },
  { semitone: 10, after: 6 }
]
const KEY_WIDTH = 12
const KEY_HEIGHT = 46

/**
 * a strip of keyboard with the chord's keys filled in. it starts at the C
 * below the lowest note and runs at least two octaves, so most chords
 * come out the same width
 */
const PianoDiagram: React.FC<{ chordPiano: ChordPiano }> = ({ chordPiano }) => {
  const notes = getPianoNotes(chordPiano)
  if (!notes.length) return <span className="sheet-diagram__missing">No keys</span>

  const selected = new Set(notes)
  const firstOctave = Math.floor(Math.min(...notes) / 12)
  const lastOctave = Math.floor(Math.max(...notes) / 12)
  const octaves = Math.max(2, lastOctave - firstOctave + 1)
  const width = octaves * 7 * KEY_WIDTH
  const blackWidth = KEY_WIDTH * 0.62

  const whiteKeys: React.ReactNode[] = []
  const blackKeys: React.ReactNode[] = []

  for (let o = 0; o < octaves; o++) {
    const base = (firstOctave + o) * 12
    WHITE_SEMITONES.forEach((semitone, i) => {
      whiteKeys.push(
        <rect
          key={`w${base + semitone}`}
          className={cn("sheet-key", selected.has(base + semitone) && "is-on")}
          x={(o * 7 + i) * KEY_WIDTH + 0.5}
          y={-3}
          width={KEY_WIDTH - 1}
          height={KEY_HEIGHT + 2.5}
          rx={1.75}
        />
      )
    })
    BLACK_KEYS.forEach(({ semitone, after }) => {
      blackKeys.push(
        <rect
          key={`b${base + semitone}`}
          className={cn("sheet-key sheet-key--black", selected.has(base + semitone) && "is-on")}
          x={(o * 7 + after) * KEY_WIDTH - blackWidth / 2}
          y={-3}
          width={blackWidth}
          height={KEY_HEIGHT * 0.6 + 3}
          rx={1.25}
        />
      )
    })
  }

  return (
    <svg viewBox={`0 0 ${width} ${KEY_HEIGHT}`} aria-hidden="true">
      {whiteKeys}
      {blackKeys}
    </svg>
  )
}

const DiagramCell: React.FC<{ chordPiano: ChordPiano; format: string }> = ({ chordPiano, format }) => {
  let art: React.ReactNode
  if (isGuitar(format)) {
    const { instrument, tabPositions, position } = getChordChart(chordPiano, format)
    art = tabPositions.length
      ? <Chord chord={tabPositions[position]} instrument={instrument} />
      : <span className="sheet-diagram__missing">No tab</span>
  } else {
    art = <PianoDiagram chordPiano={chordPiano} />
  }

  return (
    <div className="sheet-diagram">
      <ChordName chord={chordPiano.selectedChord} className="sheet-diagram__name" />
      <div className="sheet-diagram__art">{art}</div>
    </div>
  )
}

interface FieldProps {
  value: string
  // left out on the copy that's captured and printed, which is plain text
  onChange?: (value: string) => void
  placeholder: string
  label: string
  className: string
  multiline?: boolean
}

/**
 * text on the sheet that can be typed straight into in the preview. the
 * input wears the same classes as the text it becomes, so the two line up,
 * and an empty field leaves nothing behind on the exported copy
 */
const SheetField: React.FC<FieldProps> = ({ value, onChange, placeholder, label, className, multiline }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // grow the notes box with its text rather than scrolling inside it
  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [value])

  if (!onChange) {
    return value.trim() ? <div className={className}>{value}</div> : null
  }

  const fieldClass = cn("sheet-field", className)
  return multiline ? (
    <textarea
      ref={textareaRef}
      className={fieldClass}
      value={value}
      rows={1}
      placeholder={placeholder}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
    />
  ) : (
    <input
      type="text"
      className={fieldClass}
      value={value}
      placeholder={placeholder}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

interface ExportSheetProps {
  chordPianoSet: ChordPiano[]
  format: string
  mode: SheetMode
  theme: SheetTheme
  text: SheetText
  // the chords and diagrams' size, in percent
  size: number
  // makes the text editable; without it the sheet is the finished copy
  onTextChange?: (text: SheetText) => void
  ref?: React.Ref<HTMLDivElement>
  className?: string
}

/**
 * the chord sheet that's exported: a title block, then each section of the
 * progression under its label, then any notes. its colors come from its
 * own theme rather than the app's, so a light sheet can be made from the
 * dark app and the other way round
 */
export const ExportSheet: React.FC<ExportSheetProps> = ({
  chordPianoSet,
  format,
  mode,
  theme,
  text,
  size,
  onTextChange,
  ref,
  className
}) => {
  const editable = Boolean(onTextChange)
  const sections = getSections(chordPianoSet)
  const keyChord = chordPianoSet.find((chordPiano) => chordPiano.isProgKey)?.selectedChord

  const meta = [
    mode === "diagrams" ? INSTRUMENT_NAMES[format] : null,
    keyChord ? `Key of ${prettyRoot(keyChord.noteLetter)}${prettyType(keyChord.type)}` : null
  ].filter(Boolean)

  const update = (changes: Partial<SheetText>) => onTextChange?.({ ...text, ...changes })
  const updateSection = (index: number, changes: Partial<SheetSectionText>) => {
    const next = [...text.sections]
    for (let i = 0; i <= index; i++) next[i] ??= { label: "", note: "" }
    next[index] = { ...next[index], ...changes }
    update({ sections: next })
  }
  const handler = (fn: (value: string) => void) => (editable ? fn : undefined)

  const hasHead = editable || text.title.trim() || text.subtitle.trim() || meta.length > 0

  return (
    <div
      ref={ref}
      className={cn("export-sheet", className)}
      data-sheet-theme={theme}
      data-mode={mode}
      data-instrument={isGuitar(format) ? "fretted" : "piano"}
      style={{ "--sheet-scale": size / 100 } as React.CSSProperties}
    >
      <div className="export-sheet__inner">
        {hasHead ? (
          <header className="sheet-head">
            <div className="sheet-head__row">
              <SheetField
                className="sheet-title"
                value={text.title}
                placeholder="Untitled"
                label="Title"
                onChange={handler((title) => update({ title }))}
              />
              {meta.length ? <div className="sheet-meta">{meta.join("  ·  ")}</div> : null}
            </div>
            <SheetField
              className="sheet-subtitle"
              value={text.subtitle}
              placeholder="Add a subtitle, artist or tempo"
              label="Subtitle"
              onChange={handler((subtitle) => update({ subtitle }))}
            />
          </header>
        ) : null}

        <div className="sheet-sections">
          {sections.map((section, i) => {
            const { label = "", note = "" } = text.sections[i] ?? {}
            const hasSectionHead = editable || label.trim() || note.trim()

            return (
              <section key={i} className="sheet-section">
                {hasSectionHead ? (
                  <div className="sheet-section__head">
                    <span className="sheet-section__slash" aria-hidden="true" />
                    <SheetField
                      className="sheet-section__label"
                      value={label}
                      placeholder={`Section ${i + 1}`}
                      label={`Section ${i + 1} label`}
                      onChange={handler((value) => updateSection(i, { label: value }))}
                    />
                    <SheetField
                      className="sheet-section__note"
                      value={note}
                      placeholder="Add a note"
                      label={`Section ${i + 1} note`}
                      onChange={handler((value) => updateSection(i, { note: value }))}
                    />
                  </div>
                ) : null}

                {mode === "chords" ? (
                  <div className="sheet-bars">
                    {section.map((chordPiano) => (
                      <div key={chordPiano.id} className="sheet-bar">
                        <ChordName chord={chordPiano.selectedChord} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="sheet-diagrams">
                    {section.map((chordPiano) => (
                      <DiagramCell key={chordPiano.id} chordPiano={chordPiano} format={format} />
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>

        <SheetField
          className="sheet-notes"
          value={text.notes}
          placeholder="Add notes"
          label="Notes"
          multiline
          onChange={handler((notes) => update({ notes }))}
        />

        <footer className="sheet-foot">chordbuildr.com</footer>
      </div>
    </div>
  )
}
