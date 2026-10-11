import React from "react"
import { Guitar, Piano } from "lucide-react"
import { useAppContext } from "../components/context/AppContext"
import { cn } from "../lib/utils"

const FORMAT_OPTIONS = [
  { value: 'p', label: 'Piano', icon: <Piano className="h-4 w-4" /> },
  { value: 'g', label: 'Guitar', icon: <Guitar className="h-4 w-4" /> },
  { value: 'u', label: 'Ukulele', icon: <Guitar className="h-3.5 w-3.5" /> },
]

interface FormatToggleProps {
  value: string
  onChange: (format: string) => void
  className?: string
}

// segmented control for choosing which instrument chords are displayed on
export const FormatToggle: React.FC<FormatToggleProps> = ({ value, onChange, className }) => (
  <div
    role="radiogroup"
    aria-label="Instrument"
    className={cn("inline-flex rounded-lg border border-border bg-card p-1", className)}
  >
    {FORMAT_OPTIONS.map((option) => {
      const selected = value === option.value
      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={selected}
          onClick={() => onChange(option.value)}
          className={cn(
            "inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selected
              ? "bg-secondary text-foreground shadow-sm ring-1 ring-inset ring-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className={cn("grid w-4 place-items-center", selected && "text-primary")}>
            {option.icon}
          </span>
          {option.label}
        </button>
      )
    })}
  </div>
)

interface InlineConfigProps {
  className?: string
}

// inline configuration component for instrument selection
const InlineConfig: React.FC<InlineConfigProps> = ({ className = "" }) => {
  const { state, dispatch } = useAppContext()

  const handleFormatChange = (format: string) => {
    dispatch({
      type: 'UPDATE_UX_FORMAT',
      format: format
    })
  }

  return (
    <div className={cn("flex justify-center", className)}>
      <FormatToggle value={state.format} onChange={handleFormatChange} />
    </div>
  )
}

export default InlineConfig
