import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
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
import { Badge } from '../../components/ui/badge'
import { useAppContext } from '../context/AppContext'
import { playChord } from '../../utils/synthPlayer'
import { SYNTH_TYPES as SYNTH_TYPES } from '../../utils/synthLibrary'


interface ConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const UX_FORMAT_OPTIONS: Record<string, string> = {
  "p": "piano",
  "g": "guitar",
};

export function ConfigModal({ open, onOpenChange }: ConfigModalProps): JSX.Element {
  const { state, dispatch } = useAppContext()
  const [synthType, setSynthType] = useState<string>(state.synth)
  const [format, setFormat] = useState<string>(state.format)
  const [volume, setVolume] = useState<number>(state.volume)

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
      volume:  value[0]
    })

    state.building = false
  }

  const onPlayClick = (): void => {
    const pianoSet = state.chordPianoSet
    if (!pianoSet?.length) {
      addChord()
      return
    }
    playChord(dispatch, state, pianoSet[0].id)
  }

  const addChord = (): void => {
    dispatch({
      type: 'ADD_CHORD_PIANO',
      payload: 'selectedKey'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="border-b pb-5">
          <div />
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-6 -ml-1">
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
                      {value.name}
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
          <hr className="mt-[2.5em] "/>
          <Badge variant="secondary" className="float-right h-5 text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-100 mt-[1em]">
                BETA
          </Badge>
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

            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ConfigModal