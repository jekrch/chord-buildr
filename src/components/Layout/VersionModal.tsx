import React from "react"
import classNames from 'classnames';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "../../components/ui/dialog"
import { cn } from "../../lib/utils";

interface VersionEntryProps {
  version: string
  date: string
  items: string[]
}

interface VersionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const VersionEntry = ({ version, date, items }: VersionEntryProps) => (
  <div className="space-y-2">
    <div className="font-medium">
      {version} - <span className="text-muted-foreground">{date}</span>
    </div>
    <div className="space-y-1">
      {items.map((item, index) => (
        <div key={index} className="text-sm">
          {item}
        </div>
      ))}
    </div>
  </div>
)

export function VersionModal({ open, onOpenChange }: VersionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] max-w-[95vw] bg-slate-800 text-slate-300 border-slate-700 rounded-md">
        <DialogHeader className="border-b pb-4 ">
          <div className="absolute inset-0" />
          <h2 className="text-lg font-semibold text-center">change log</h2>
        </DialogHeader>
        
        <div 
          className="space-y-6 overflow-y-auto pr-2 max-h-[60vh] z-30"
        >
          <div className="space-y-8">
            <VersionEntry
              version="1.8"
              date="11.03.2024"
              items={[
                "migrated to typescript and vite",
              ]}
            />

            <VersionEntry
              version="1.7.1"
              date="03.27.2023"
              items={[
                "fixed bug with slash note notation which caused slash notes to some times use inconsistent accidentals between views",
              ]}
            />

            <VersionEntry
              version="1.7"
              date="03.27.2023"
              items={[
                "when a key is selected, the other note letters adjust to display the correct notation in that key",
              ]}
            />

            <VersionEntry
              version="1.6"
              date="03.05.2023"
              items={[
                "when a key is selected, display a roman numeral for each chord",
                "users can now edit their progression directly in text by clicking on the edit icon in the top nav",
              ]}
            />

            <VersionEntry
              version="1.5"
              date="02.05.2023"
              items={[
                "add play button to header for cycling through chords",
                "disable header buttons when unavailable",
              ]}
            />

            <VersionEntry
              version="1.4"
              date="09.19.2021"
              items={[
                "add synth settings modal",
                "volume control and five synth voice options",
                "backwards compatible url encoding for synth settings",
              ]}
            />

            <VersionEntry
              version="1.3"
              date="09.11.2021"
              items={[
                "adjust volume to reduce distortion",
                "modify chord volume according to pitch",
                "version history modal",
              ]}
            />

            <VersionEntry
              version="1.2"
              date="09.05.2021"
              items={[
                "display flats instead of sharps for a given chord piano",
                "security updates",
              ]}
            />

            <VersionEntry
              version="1.1"
              date="05.16.2021"
              items={[
                "redesigned UI for mobile",
                "improved url handling for facebook and google",
                "performance improvements",
              ]}
            />

            <VersionEntry
              version="1.0"
              date="03.20.2021"
              items={[
                "user chord input with interactive keyboards",
                "url encoded progressions for sharing", 
                "synth playback via buttons and chord chart",
                "undo and clear functionality",
                "navigate to chords on chart click",
              ]}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default VersionModal