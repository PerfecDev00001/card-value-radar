import * as React from "react"
import { X, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MultiSelectProps {
  options: { label: string; value: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder = "Select items...",
  className
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Ensure options and selected are always arrays
  const safeOptions = React.useMemo(() => {
    if (!Array.isArray(options)) {
      console.warn('MultiSelect: options prop is not an array, using empty array')
      return []
    }
    return options
  }, [options])

  const safeSelected = React.useMemo(() => {
    if (!Array.isArray(selected)) {
      console.warn('MultiSelect: selected prop is not an array, using empty array')
      return []
    }
    return selected
  }, [selected])

  const handleUnselect = (item: string) => {
    onChange(safeSelected.filter((i) => i !== item))
  }

  const handleSelect = (item: string) => {
    if (safeSelected.includes(item)) {
      handleUnselect(item)
    } else {
      onChange([...safeSelected, item])
    }
  }

  if (!mounted) {
    return (
      <Button
        variant="outline"
        className={cn(
          "w-full justify-between min-h-10 h-auto",
          className
        )}
        disabled
      >
        <span className="text-muted-foreground">Loading...</span>
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-10 h-auto",
            className
          )}
        >
          <div className="flex gap-1 flex-wrap">
            {safeSelected.length > 0 ? (
              safeSelected.map((item) => {
                const option = safeOptions.find((opt) => opt.value === item)
                return (
                  <Badge
                    variant="secondary"
                    key={item}
                    className="mr-1 mb-1"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleUnselect(item)
                    }}
                  >
                    {option?.label}
                    <button
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleUnselect(item)
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleUnselect(item)
                      }}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                )
              })
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        {mounted && (
          <Command key={`command-${safeOptions.length}-${safeSelected.length}`}>
            <CommandInput placeholder="Search..." />
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {safeOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      safeSelected.includes(option.value)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </div>
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  )
}