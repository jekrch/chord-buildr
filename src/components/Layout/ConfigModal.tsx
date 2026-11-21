import { useCallback, useId, useRef, useState, type JSX, type ReactNode } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  AudioLinesIcon,
  AudioWaveform,
  Guitar,
  Layers,
  Monitor,
  Music,
  Play,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Volume2
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Checkbox } from '../../components/ui/checkbox'
import { Knob } from '../Knob'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Slider } from '../../components/ui/slider'
import { useActions, useAppStore, useSettings } from '../../store/progressionStore'
import { playChordById } from '../../audio/player'
import {
  DEFAULT_EQ,
  DEFAULT_SOUND,
  EQSettings,
  PlayStyle,
  SOUND_RANGES,
  SoundControl,
  SoundSettings,
  eqDiffers,
  isGuitar,
  resolvePlayStyle,
  soundDiffers
} from '../../utils/settings'
import {
  ArpeggioOptions,
  PlayPrefs,
  StrumDirection,
  readPlayPrefs,
  writePlayPrefs
} from '../../utils/playPrefs'
import { SYNTH_TYPES } from '../../utils/synthTypes'
import { SOUND_PRESETS, findPreset } from '../../utils/soundPresets'
import { FormatToggle, FretViewToggle } from '../InlineConfig'
import { SegmentedToggle, ToggleOption } from '../SegmentedToggle'
import { TabBar, TabOption, TabPanel } from '../TabBar'
import { ArpeggioControls } from '../ArpeggioControls'
import { Collapsible } from '../Collapsible'
import { cn } from '../../lib/utils'

interface ConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SettingsTab = 'sound' | 'shape' | 'play' | 'display'

const TABS: readonly TabOption<SettingsTab>[] = [
  { value: 'sound', label: 'Sound', icon: <AudioWaveform className="h-4 w-4" /> },
  { value: 'shape', label: 'Shape', icon: <SlidersHorizontal className="h-4 w-4" /> },
  { value: 'play', label: 'Play', icon: <Music className="h-4 w-4" /> },
  { value: 'display', label: 'Display', icon: <Monitor className="h-4 w-4" /> },
]

// the tab the settings were last left on, so they reopen where they were
let lastTab: SettingsTab = 'sound'

const PLAY_STYLE_OPTIONS: ToggleOption[] = [
  { value: 'a', label: 'Auto', icon: <Sparkles className="h-4 w-4" /> },
  { value: 'c', label: 'Chord', icon: <Layers className="h-4 w-4" /> },
  { value: 's', label: 'Strum', icon: <Guitar className="h-4 w-4" /> },
  { value: 'r', label: 'Arpeggio', icon: <TrendingUp className="h-4 w-4" /> },
]

const STRUM_OPTIONS: ToggleOption[] = [
  { value: 'down', label: 'Down', icon: <ArrowDown className="h-4 w-4" /> },
  { value: 'up', label: 'Up', icon: <ArrowUp className="h-4 w-4" /> },
  { value: 'alternate', label: 'Alternate', icon: <ArrowUpDown className="h-4 w-4" /> },
]

const STRUM_HINTS: Record<StrumDirection, string> = {
  down: 'Low string to high, like a downstroke.',
  up: 'High string to low, like an upstroke.',
  alternate: 'Down, then up, taking turns with each chord.',
}

const PLAY_STYLE_HINTS: Record<PlayStyle, string> = {
  a: 'Strums guitar and ukulele chords, and plays piano chords together.',
  c: 'Every note at once.',
  s: 'A quick sweep from the lowest note up.',
  r: 'One note at a time, in the pattern below, so you can hear each voice.',
}

// the dials under Shape, in order
const SHAPE_KNOBS: { control: SoundControl; label: string; format?: (value: number) => string }[] = [
  { control: 'tone', label: 'Tone' },
  { control: 'attack', label: 'Attack' },
  { control: 'length', label: 'Length' },
  { control: 'space', label: 'Space', format: (value) => `${value}` },
]

// the eq's bands, in order
const EQ_KNOBS: { band: keyof EQSettings; label: string }[] = [
  { band: 'low', label: 'Low' },
  { band: 'mid', label: 'Mid' },
  { band: 'high', label: 'High' },
]

// changes closer together than this only preview once
const PREVIEW_GAP_MS = 250

/**
 * plays the first chord with the current settings, if there is one. the
 * store updates synchronously, so called right after a change it plays
 * the new sound
 */
function playFirstChord(): boolean {
  const [firstChord] = useAppStore.getState().chords
  if (!firstChord) return false
  playChordById(firstChord.id)
  return true
}

export function ConfigModal({ open, onOpenChange }: ConfigModalProps): JSX.Element {
  const settings = useSettings()
  const {
    setSynth,
    setVolume,
    setEq,
    setSound,
    setVoiceAndSound,
    setFormat,
    setFretView,
    addChord
  } = useActions()
  const eq = settings.eq ?? DEFAULT_EQ
  const sound = settings.sound ?? DEFAULT_SOUND
  const activePreset = findPreset(settings.synth, sound)

  // the volume and balance while their sliders are dragged; the store
  // only takes them when the slider is let go
  const [draggedVolume, setDraggedVolume] = useState<number | null>(null)
  const volume = draggedVolume ?? settings.volume
  const [draggedBalance, setDraggedBalance] = useState<number | null>(null)
  const balance = draggedBalance ?? sound.balance

  // this browser's play preferences, which aren't part of the url
  const [prefs, setPrefs] = useState(readPlayPrefs)
  const { previewChanges } = prefs
  const lastPreview = useRef(0)
  const playStyle = resolvePlayStyle(sound.play, settings.format)

  const idBase = useId()
  const [tab, setTab] = useState<SettingsTab>(lastTab)

  const switchTab = (next: SettingsTab): void => {
    lastTab = next
    setTab(next)
  }

  // after a change, plays the first chord with it, if that's switched on
  const preview = useCallback(() => {
    if (!previewChanges) return
    const now = Date.now()
    if (now - lastPreview.current < PREVIEW_GAP_MS) return
    lastPreview.current = now
    playFirstChord()
  }, [previewChanges])

  // saves a preference. writePlayPrefs comes first, as the player reads
  // the saved preferences, so a preview hears the change
  const updatePrefs = (next: Partial<PlayPrefs>): void => {
    writePlayPrefs(next)
    setPrefs((current) => ({ ...current, ...next }))
  }

  const updateArpeggio = (next: Partial<ArpeggioOptions>): void => {
    writePlayPrefs({ arpeggio: next })
    setPrefs((current) => ({ ...current, arpeggio: { ...current.arpeggio, ...next } }))
    preview()
  }

  const handleSynthChange = (synth: string): void => {
    if (synth === settings.synth) return
    setSynth(synth)
    preview()
  }

  const handleVolumeCommit = ([value]: number[]): void => {
    setDraggedVolume(null)
    if (value !== undefined && value !== settings.volume) {
      setVolume(value)
      preview()
    }
  }

  const updateSound = (next: SoundSettings): void => {
    if (!soundDiffers(sound, next)) return
    setSound(next)
    preview()
  }

  const handleBalanceCommit = ([value]: number[]): void => {
    setDraggedBalance(null)
    if (value !== undefined) updateSound({ ...sound, balance: value })
  }

  const resetShape = (): void => {
    updateSound({ ...DEFAULT_SOUND, play: sound.play })
  }

  const updateEq = (next: EQSettings): void => {
    if (!eqDiffers(eq, next)) return
    setEq(next)
    preview()
  }

  const onPlayClick = (): void => {
    if (!playFirstChord()) addChord()
  }

  const panels: Record<SettingsTab, ReactNode> = {
    sound: (
      <>
        <Group label="Voice">
          <Select value={settings.synth} onValueChange={handleSynthChange}>
            <SelectTrigger aria-label="Voice">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SYNTH_TYPES).map(([key, value]) => (
                <SelectItem key={`k-${key}`} value={key}>
                  <span className="flex items-center gap-2">
                    {value.name}
                    {value.getSampler && (
                      <AudioLinesIcon className="h-3.5 w-3.5 text-muted-foreground" aria-label="sampled" />
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Hint>{SYNTH_TYPES[settings.synth]?.blurb}</Hint>
        </Group>

        <Group label="Volume">
          <div className="flex items-center gap-3">
            <Volume2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
            <Slider
              value={[volume]}
              onValueChange={([value]) => setDraggedVolume(value ?? null)}
              onValueCommit={handleVolumeCommit}
              max={100}
              step={1}
              className="w-full"
              aria-label="Volume"
            />
            <span className="w-7 text-right text-xs tabular-nums text-muted-foreground">
              {volume}
            </span>
          </div>
        </Group>

        <Group label="Presets">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Presets">
            {SOUND_PRESETS.map((preset) => {
              const active = preset === activePreset
              return (
                <button
                  key={preset.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    if (active) return
                    setVoiceAndSound(preset.synth, preset.sound)
                    preview()
                  }}
                  className={cn(
                    "h-7 rounded-full border px-3 text-xs font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  {preset.name}
                </button>
              )
            })}
          </div>
          <Hint>A voice and shape that go well together.</Hint>
        </Group>
      </>
    ),

    shape: (
      <>
        <Group label="Shape" action={<ResetButton onClick={resetShape} />}>
          <div className="flex justify-around pt-1">
            {SHAPE_KNOBS.map(({ control, label, format }) => (
              <Knob
                key={control}
                value={sound[control]}
                min={SOUND_RANGES[control][0]}
                max={SOUND_RANGES[control][1]}
                onChange={(value) => updateSound({ ...sound, [control]: value })}
                label={label}
                formatValue={format}
              />
            ))}
          </div>
        </Group>

        <Group label="Balance">
          <div className="flex items-center gap-3">
            <span className="w-10 text-xs text-muted-foreground">Bass</span>
            <div className="relative flex-1">
              {/* marks the default, where the slider sits at 0 */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-muted-foreground/50"
              />
              <Slider
                value={[balance]}
                onValueChange={([value]) => setDraggedBalance(value ?? null)}
                onValueCommit={handleBalanceCommit}
                min={SOUND_RANGES.balance[0]}
                max={SOUND_RANGES.balance[1]}
                step={1}
                aria-label="Balance"
              />
            </div>
            <span className="w-10 text-right text-xs text-muted-foreground">Treble</span>
          </div>
          <Hint>Low notes are favored a little at the center, so high notes don't drown out the bass.</Hint>
        </Group>

        <Group label="Equalizer" action={<ResetButton onClick={() => updateEq(DEFAULT_EQ)} />}>
          <div className="flex justify-around px-2 pt-1">
            {EQ_KNOBS.map(({ band, label }) => (
              <Knob
                key={band}
                value={eq[band]}
                min={-10}
                max={10}
                onChange={(value) => updateEq({ ...eq, [band]: value })}
                label={label}
              />
            ))}
          </div>
          <Hint>Boosts are evened out in volume, so they change the color rather than the loudness.</Hint>
        </Group>
      </>
    ),

    play: (
      <>
        <Group label="Play style">
          <SegmentedToggle
            options={PLAY_STYLE_OPTIONS}
            label="Play style"
            value={sound.play}
            onChange={(play) => updateSound({ ...sound, play: play as PlayStyle })}
            className={cn(
              "flex w-full [&>button]:flex-1 [&>button]:justify-center [&>button]:gap-1.5 [&>button]:px-1.5",
              // the icons only fit beside the labels on wider screens
              "[&>button>span:first-child]:hidden sm:[&>button>span:first-child]:grid"
            )}
          />
          <Hint>{PLAY_STYLE_HINTS[sound.play]}</Hint>
        </Group>

        {/* each only while it's what chords are played with, which is all it changes */}
        <Collapsible open={playStyle === 's'}>
          <Group label="Strum direction">
            <SegmentedToggle
              options={STRUM_OPTIONS}
              label="Strum direction"
              value={prefs.strum}
              onChange={(strum) => {
                if (strum === prefs.strum) return
                updatePrefs({ strum: strum as StrumDirection })
                preview()
              }}
              className="flex w-full [&>button]:flex-1 [&>button]:justify-center [&>button]:gap-1.5"
            />
            <Hint>{STRUM_HINTS[prefs.strum]}</Hint>
          </Group>
        </Collapsible>
        <Collapsible open={playStyle === 'r'}>
          <Group label="Arpeggio">
            <ArpeggioControls value={prefs.arpeggio} onChange={updateArpeggio} />
          </Group>
        </Collapsible>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-accent/40">
          <Checkbox
            className="mt-0.5"
            checked={prefs.humanize}
            onCheckedChange={(checked) => {
              updatePrefs({ humanize: checked === true })
              preview()
            }}
          />
          <span className="space-y-0.5">
            <span className="block text-sm font-medium">Humanize</span>
            <span className="block text-xs text-muted-foreground">
              Loosens each note's timing and level a little, like a person playing.
            </span>
          </span>
        </label>
      </>
    ),

    display: (
      <Group label="Instrument">
        <FormatToggle
          value={settings.format}
          onChange={setFormat}
          className="flex w-full [&>button]:flex-1 [&>button]:justify-center"
        />
        <Hint>Choose the instrument chords are shown on.</Hint>
        <Collapsible open={isGuitar(settings.format)}>
          <div className="space-y-2 pt-3">
            <FretViewToggle
              value={settings.fretView}
              onChange={setFretView}
              className="flex w-full [&>button]:flex-1 [&>button]:justify-center"
            />
            <Hint>Full shows each chord's controls; Tab shows a compact chart of names and tabs.</Hint>
          </div>
        </Collapsible>
      </Group>
    ),
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        a fixed height, so switching tabs never resizes the dialog; each
        tab scrolls on its own when it's taller
      */}
      <DialogContent className="flex h-[min(40rem,88vh)] max-h-[88vh] flex-col gap-4 sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <TabBar
          tabs={TABS}
          value={tab}
          onChange={switchTab}
          label="Settings"
          idBase={idBase}
          className="flex-shrink-0"
        />

        {/*
          the panels sit on top of each other, so switching crossfades
          between them, and each keeps its own scroll position. -mx-1 with
          their px-1 leaves room for focus rings
        */}
        <div className="relative -mx-1 min-h-0 flex-1">
          {TABS.map(({ value }) => {
            const selected = value === tab
            return (
              <TabPanel
                key={value}
                idBase={idBase}
                value={value}
                selected={selected}
                className={cn(
                  "absolute inset-0 space-y-6 overflow-y-auto overscroll-contain px-1 py-1",
                  "transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none",
                  selected
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none invisible translate-y-1 opacity-0"
                )}
              >
                {panels[value]}
              </TabPanel>
            )
          })}
        </div>

        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onPlayClick}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-primary pl-3 pr-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            Preview
          </button>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <Checkbox
              checked={previewChanges}
              onCheckedChange={(checked) => updatePrefs({ previewChanges: checked === true })}
            />
            Play on change
          </label>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * a labeled group of controls within a tab, with an optional action
 * (such as a reset) beside its label
 */
function Group({ label, action, children }: { label: string; action?: ReactNode; children: ReactNode }): JSX.Element {
  return (
    <section className="space-y-2.5">
      <div className="flex min-h-7 items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function Hint({ children }: { children: ReactNode }): JSX.Element {
  return <p className="text-xs text-muted-foreground">{children}</p>
}

function ResetButton({ onClick }: { onClick: () => void }): JSX.Element {
  return (
    <Button variant="ghost" size="sm" className="-my-1 h-7 px-2 text-xs" onClick={onClick}>
      Reset
    </Button>
  )
}
