import { useEffect, useState, type JSX } from 'react'
import { Play, AudioLinesIcon, Volume2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
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
//import { Badge } from '../../components/ui/badge'
import { useAppContext } from '../context/AppContext'
import { DEFAULT_EQ, EQSettings, notEqual, playChord } from '../../utils/synthPlayer'
import { SYNTH_TYPES as SYNTH_TYPES } from '../../utils/synthLibrary'
import { FormatToggle, FretViewToggle } from '../InlineConfig'
import { isGuitar } from '../../utils/guitarUtil'

interface ConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const UX_FORMAT_OPTIONS: Record<string, string> = {
  "p": "piano",
  "g": "guitar",
  "u": "ukulele",
};

export function ConfigModal({ open, onOpenChange }: ConfigModalProps): JSX.Element {
  const { state, dispatch } = useAppContext()
  const [synthType, setSynthType] = useState<string>(state.synth)
  const [format, setFormat] = useState<string>(state.format)
  const [volume, setVolume] = useState<number>(state.volume)
  const [eqSettings, setEqSettings] = useState<EQSettings>(state.eq ?? DEFAULT_EQ);

  useEffect(() => {

    if (
      notEqual(state.eq, eqSettings)
    ) {
      dispatch({
        type: 'UPDATE_EQ',
        eq: eqSettings
      })
    }
  }, [eqSettings]);

  // useEffect(() => {
  //   return;
  //   setEqSettings(state.eq!);
  // }, [state.eq]);

  useEffect(() => {
    setSynthType(state.synth);
  }, [state.synth]);

  useEffect(() => {
    setVolume(state.volume)
  }, [state.volume]);

  useEffect(() => {
    setFormat(state.format)
  }, [state.format]);

  // temporary state for the volume while dragging
  const [localVolume, setLocalVolume] = useState<number>(state.volume)

  const handleSynthSelectChange = (value: string): void => {
    dispatch({
      type: 'UPDATE_SYNTH',
      synth: value
    })
  }

  const handleUxFormatSelectChange = (value: string): void => {
    dispatch({
      type: 'UPDATE_UX_FORMAT',
      format: value
    })
  }

  const handleFretViewChange = (value: string): void => {
    dispatch({
      type: 'UPDATE_FRET_VIEW',
      fretView: value
    })
  }

  // handle the volume slider being dragged
  const handleVolumeDrag = (value: number[]): void => {
    setLocalVolume(value[0])
  }

  // only update the actual volume when the slider is released
  const handleVolumeChangeComplete = (value: number[]): void => {
    if (volume === value[0]) {
      return
    }

    state.building = true

    dispatch({
      type: 'UPDATE_SYNTH_VOLUME',
      volume: value[0]
    })

    state.building = false
  }

  const onPlayClick = (): void => {
    const pianoSet = state.chordPianoSet
    if (!pianoSet?.length) {
      addChord()
      return
    }
    playChord(dispatch, state, pianoSet[0])
  }

  const addChord = (): void => {
    dispatch({
      type: 'ADD_CHORD_PIANO',
      payload: 'selectedKey'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="-mx-1 space-y-6 overflow-y-auto px-1">
          <section className="space-y-3">
            <h3 className={SECTION_LABEL}>Sound</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={onPlayClick}
                aria-label="Preview sound"
                title="Preview sound"
                className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              </button>
              <Select
                value={synthType}
                onValueChange={handleSynthSelectChange}
              >
                <SelectTrigger className="flex-1" aria-label="Voice">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SYNTH_TYPES).map(([key, value]) => (
                    <SelectItem key={`k-${key}`} value={key}>
                      <span className="flex items-center gap-2">
                        {value.name}
                        {value?.getSampler && (
                          <AudioLinesIcon className="h-3.5 w-3.5 text-muted-foreground" aria-label="sampled" />
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 pl-1">
              <Volume2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
              <Slider
                value={[localVolume]}
                onValueChange={handleVolumeDrag}
                onValueCommit={handleVolumeChangeComplete}
                max={100}
                step={1}
                className="w-full"
                aria-label="Volume"
              />
              <span className="w-7 text-right text-xs tabular-nums text-muted-foreground">
                {localVolume}
              </span>
            </div>
          </section>

          <section className="space-y-4 border-t border-border pt-5">
            <div className="flex items-center justify-between">
              <h3 className={SECTION_LABEL}>Equalizer</h3>
              <Button
                variant="ghost"
                size="sm"
                className="-my-1 h-7 px-2 text-xs"
                onClick={() => setEqSettings({ low: 0, mid: 0, high: 0 })}
              >
                Reset
              </Button>
            </div>
            <div className="flex justify-around px-2">
              <Knob
                value={eqSettings.low}
                min={-10}
                max={10}
                onChange={(value: any) => setEqSettings((prev: any) => ({ ...prev, low: value }))}
                label="Low"
              />
              <Knob
                value={eqSettings.mid}
                min={-10}
                max={10}
                onChange={(value: any) => setEqSettings((prev: any) => ({ ...prev, mid: value }))}
                label="Mid"
              />
              <Knob
                value={eqSettings.high}
                min={-10}
                max={10}
                onChange={(value: any) => setEqSettings((prev: any) => ({ ...prev, high: value }))}
                label="High"
              />
            </div>
          </section>

          <section className="space-y-3 border-t border-border pt-5">
            <h3 className={SECTION_LABEL}>Display</h3>
            <FormatToggle
              value={format}
              onChange={handleUxFormatSelectChange}
              className="flex w-full [&>button]:flex-1 [&>button]:justify-center"
            />
            <p className="text-xs text-muted-foreground">
              Choose the instrument chords are shown on.
            </p>
            {isGuitar(format) && (
              <>
                <FretViewToggle
                  value={state.fretView}
                  onChange={handleFretViewChange}
                  className="flex w-full [&>button]:flex-1 [&>button]:justify-center"
                />
                <p className="text-xs text-muted-foreground">
                  Full shows each chord's controls; Tab shows a compact chart of names and tabs.
                </p>
              </>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const SECTION_LABEL = "text-sm font-medium text-foreground"
