import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "../../components/ui/dialog"

interface VersionEntry {
  version: string
  date: string
  items: string[]
}

interface VersionEntryProps extends VersionEntry {}

interface VersionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// version history data stored as a json object
const versionHistory: VersionEntry[] = [
  {
    version: "4.3",
    date: "01.12.2025",
    items: [
      "implemented umami for analytics",
    ]
  },
  {
    version: "4.2",
    date: "01.05.2025",
    items: [
      "added inline instrument selector",
      "animated welcome page",
      "fixed bug with progression editor when no progression is set"
    ]
  },
  {
    version: "4.1",
    date: "12.29.2024",
    items: [
      "EQ settings are now available in the synth settings modal",
    ]
  },
  {
    version: "4.0",
    date: "12.22.2024",
    items: [
      "ukulele chord diagrams are now available through settings > format",
      "improvements made to guitar chord UI",
      "several bugfixes related to guitar chord functionality"
    ]
  },
  {
    version: "3.1",
    date: "12.15.2024",
    items: [
      "guitar mode now plays all synth and additional sampler voices",
      "more responsive scrolling behavior and other UI bugfixes",
      "performance enhancements to support larger progressions",
      "added chord types"
    ]
  },
  {
    version: "3.0",
    date: "12.08.2024",
    items: [
      "guitar chord diagrams are now supported",
      "multiple chord positions can be displayed and saved",
      "strummed samples are used for audio in guitar format"
    ]
  },
  {
    version: "2.0",
    date: "12.01.2024",
    items: [
      "rolling out new UI",
      "preparing for upcoming guitar tab support"
    ]
  },
  {
    version: "1.8",
    date: "11.03.2024",
    items: [
      "migrated to typescript and vite",
    ]
  },
  {
    version: "1.7.1",
    date: "03.27.2023",
    items: [
      "fixed bug with slash note notation which caused slash notes to some times use inconsistent accidentals between views",
    ]
  },
  {
    version: "1.7",
    date: "03.27.2023",
    items: [
      "when a key is selected, the other note letters adjust to display the correct notation in that key",
    ]
  },
  {
    version: "1.6",
    date: "03.05.2023",
    items: [
      "when a key is selected, display a roman numeral for each chord",
      "users can now edit their progression directly in text by clicking on the edit icon in the top nav",
    ]
  },
  {
    version: "1.5",
    date: "02.05.2023",
    items: [
      "add play button to header for cycling through chords",
      "disable header buttons when unavailable",
    ]
  },
  {
    version: "1.4",
    date: "09.19.2021",
    items: [
      "add synth settings modal",
      "volume control and five synth voice options",
      "backwards compatible url encoding for synth settings",
    ]
  },
  {
    version: "1.3",
    date: "09.11.2021",
    items: [
      "adjust volume to reduce distortion",
      "modify chord volume according to pitch",
      "version history modal",
    ]
  },
  {
    version: "1.2",
    date: "09.05.2021",
    items: [
      "display flats instead of sharps for a given chord piano",
      "security updates",
    ]
  },
  {
    version: "1.1",
    date: "05.16.2021",
    items: [
      "redesigned UI for mobile",
      "improved url handling for facebook and google",
      "performance improvements",
    ]
  },
  {
    version: "1.0",
    date: "03.20.2021",
    items: [
      "user chord input with interactive keyboards",
      "url encoded progressions for sharing", 
      "synth playback via buttons and chord chart",
      "undo and clear functionality",
      "navigate to chords on chart click",
    ]
  }
];

const VersionEntry = ({ version, date, items }: VersionEntryProps) => (
  <div className="border-t border-gray-700 pt-2">
    <div className="text-slate-200 flex gap-2 items-baseline">
      <span className="text-sm">{version}</span>
      <span className="text-xs text-gray-400">- {date}</span>
    </div>
    <div className="mt-2 ml-3 space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2 text-gray-300 ml-[0.5em]">
          <span className="mt-[0.35em] h-1.5 w-1.5 rounded-full bg-gray-500 flex-shrink-0" />
          <span className="text-xs">{item}</span>
        </div>
      ))}
    </div>
  </div>
)

export function VersionModal({ open, onOpenChange }: VersionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="h-4">
          <div className="absolute inset-0" />
          <h2 className="text-base font-semibold text-center !-mt-1">change log</h2>
        </DialogHeader>
        
        <div className="space-y-6 overflow-y-auto pr-2 max-h-[60vh] z-30">
          <div className="space-y-4 mr-2">
            {versionHistory.map((entry, index) => (
              <VersionEntry
                key={index}
                version={entry.version}
                date={entry.date}
                items={entry.items}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default VersionModal