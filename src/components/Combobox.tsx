import * as React from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { cn } from "../lib/utils"

export interface ComboboxItem {
  value: string
  label: string
}

interface ComboboxProps {
  items: ComboboxItem[]
  value?: string
  defaultValue?: string
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}

export function Combobox({
  items,
  value: controlledValue,
  defaultValue = "",
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  onValueChange,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(defaultValue)
  const [search, setSearch] = React.useState("")

  // handle controlled component
  const currentValue = controlledValue !== undefined ? controlledValue : value

  // handle selection changes
  const handleSelect = React.useCallback((selectedValue: string) => {
    setValue(selectedValue)
    onValueChange?.(selectedValue)
    setOpen(false)
    setSearch("")
  }, [onValueChange])

  // filter items based on search
  const filteredItems = React.useMemo(() => {
    if (!search) return items
    
    return items.filter((item) =>
      item.label.toLowerCase().includes(search.toLowerCase())
    )
  }, [items, search])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-border",
            "bg-slate-300/10 px-3 py-2 text-sm shadow-sm ring-offset-background",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
            className
          )}
          disabled={disabled}
        >
          <span>
            {currentValue
              ? items.find((item) => item.value === currentValue)?.label
              : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-full min-w-[var(--radix-select-trigger-width)] p-0" 
        //position="popper"
        align="start"
        sideOffset={4}
      >
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder} 
            className="h-9"
            value={search}
            onValueChange={setSearch}
          />
          <div className="relative">
            <ChevronUp className="absolute right-2 top-1 h-4 w-4 opacity-50" />
            <CommandList className="max-h-[300px] overflow-y-auto scrollbar-none">
              <CommandEmpty className="py-6 text-center text-sm">{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {filteredItems.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={handleSelect}
                    className="relative flex h-9 cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground aria-selected:bg-primary"
                  >
                    <span>{item.label}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        currentValue === item.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <ChevronDown className="absolute bottom-1 right-2 h-4 w-4 opacity-50" />
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}