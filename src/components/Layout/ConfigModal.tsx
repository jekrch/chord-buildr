import { useEffect, useState } from 'react'
import { Play, AudioLinesIcon } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Knob } from '../Knob'
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b pb-5 flex-shrink-0">
          <div />
        </DialogHeader>

        <div className="py-4 overflow-y-auto">
          <div className="flex items-center gap-6 -ml-3">
            <button
              onClick={onPlayClick}
              className="text-primary hover:text-primary/80 transition-colors flex-shrink-0"
            >
              <Play size={62} />
            </button>

            <div className="flex-grow space-y-8">
              <Select
                value={synthType}
                onValueChange={handleSynthSelectChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SYNTH_TYPES).map(([key, value]) => (
                    <SelectItem key={`k-${key}`} value={key}>
                      <div className="flex items-center gap-2 w-full">
                        {value.name}
                        <div className="ml-[8em] absolute float-right">
                          {value?.getSampler && (
                            <AudioLinesIcon size={16} />
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Slider
                value={[localVolume]}
                onValueChange={handleVolumeDrag}
                onValueCommit={handleVolumeChangeComplete}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t">
            <div className="flex items-start gap-6">
              <div className="flex flex-col items-end w-[5em] pr-4">
                <div className="text-slate-400 mb-4">equalizer</div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setEqSettings({ low: 0, mid: 0, high: 0 })}
                >
                  reset
                </Button>
              </div>
              <div className="flex flex-grow justify-between mr-4">
                <Knob
                  value={eqSettings.low}
                  min={-10}
                  max={10}
                  onChange={(value: any) => setEqSettings((prev: any) => ({ ...prev, low: value }))}
                  label="low"
                />
                <Knob
                  value={eqSettings.mid}
                  min={-10}
                  max={10}
                  onChange={(value: any) => setEqSettings((prev: any) => ({ ...prev, mid: value }))}
                  label="mid"
                />
                <Knob
                  value={eqSettings.high}
                  min={-10}
                  max={10}
                  onChange={(value: any) => setEqSettings((prev: any) => ({ ...prev, high: value }))}
                  label="high"
                />
              </div>
            </div>
          </div>

          <hr className="mt-8" />
          {/* <Badge variant="secondary" className="float-right h-5 text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-100 mt-[1em]">
            BETA
          </Badge> */}
          <div className="flex mt-[2em]">
            <div className="w-[5em] text-right pr-4 align-middle my-auto text-slate-400">
              format
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={format}
                onValueChange={handleUxFormatSelectChange}
              >
                <SelectTrigger className="w-[7em]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(UX_FORMAT_OPTIONS).map(([key, value]) => (
                    <SelectItem key={`format-${key}`} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-slate-500 ml-2 text-xs">choose an instr to display chords on</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}