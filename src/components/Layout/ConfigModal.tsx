import { useRef, useState } from 'react'
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
import { useAppContext } from '../context/AppContext'
import { playPiano } from '../../utils/synthPlayer'
import { synthTypes } from '../../utils/synthLibrary'

interface SettingRef {
  synthType: string
  volume: number
}

interface ConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConfigModal({ open, onOpenChange }: ConfigModalProps): JSX.Element {
  const { state, dispatch } = useAppContext()
  const settingRef = useRef<SettingRef>({
    synthType: state.synth,
    volume: state.volume
  })
  
  // temporary state for the volume while dragging
  const [localVolume, setLocalVolume] = useState<number>(state.volume)

  const handleSynthSelectChange = (value: string): void => {
    settingRef.current.synthType = value
    dispatch({
      type: 'UPDATE_SYNTH',
      synth: settingRef.current.synthType
    })
  }

  // handle the volume slider being dragged
  const handleVolumeDrag = (value: number[]): void => {
    setLocalVolume(value[0])
  }

  // only update the actual volume when the slider is released
  const handleVolumeChangeComplete = (value: number[]): void => {
    if (settingRef.current.volume === value[0]) {
      return
    }

    state.building = true
    settingRef.current.volume = value[0]
    
    dispatch({
      type: 'UPDATE_SYNTH_VOLUME',
      volume: settingRef.current.volume
    })

    state.building = false
  }

  const onPlayClick = (): void => {
    const pianoSet = state.chordPianoSet
    if (!pianoSet?.length) {
      addChord()
      return
    }
    playPiano(dispatch, state, pianoSet[0].id)
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
                value={settingRef.current.synthType}
                onValueChange={handleSynthSelectChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(synthTypes).map(([key, value]) => (
                    <SelectItem key={`k-${key}`} value={key}>
                      {value}
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
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ConfigModal