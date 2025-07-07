import { useState, useEffect, useRef } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  label = "Address",
  placeholder = "Full Address and Post code",
  className = ""
}: AddressAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  // Fetch address suggestions
  const { data: rawSuggestions } = useQuery({
    queryKey: ["/api/search-addresses", searchQuery],
    queryFn: () => apiRequest("GET", `/api/search-addresses?q=${encodeURIComponent(searchQuery)}&limit=8`),
    enabled: searchQuery.length >= 1,
  });

  const suggestions = Array.isArray(rawSuggestions) ? rawSuggestions : [];

  // Auto-open popover when suggestions are available
  useEffect(() => {
    if (suggestions.length > 0 && value.length >= 1) {
      setOpen(true);
    } else if (suggestions.length === 0 && value.length < 1) {
      setOpen(false);
    }
  }, [suggestions, value]);

  const handleSelect = (selectedAddress: string) => {
    onChange(selectedAddress);
    setOpen(false);
    textareaRef.current?.focus();
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    // Don't automatically close/open popover - let the effect handle it based on suggestions
  };

  return (
    <div className={className}>
      <Label htmlFor="address-input">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Textarea
              ref={textareaRef}
              id="address-input"
              value={value}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={placeholder}
              className="min-h-[100px] pr-10"
              onFocus={() => {
                if (value.length >= 1) {
                  setOpen(true);
                }
              }}
              onBlur={(e) => {
                // Only close if not clicking on the popover
                const relatedTarget = e.relatedTarget as HTMLElement;
                if (!relatedTarget || !relatedTarget.closest('[data-radix-popper-content-wrapper]')) {
                  setTimeout(() => setOpen(false), 150);
                }
              }}
            />
            <MapPin className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50" side="bottom" align="start">
          <Command>
            <CommandInput 
              placeholder="Search UK addresses..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="hidden"
            />
            <CommandList className="max-h-[200px] overflow-y-auto">
              {value.length < 1 ? (
                <div className="p-3 text-sm text-muted-foreground">
                  Start typing an address to see suggestions...
                </div>
              ) : suggestions.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">
                  Continue typing to see address suggestions...
                </div>
              ) : (
                <CommandGroup>
                  {suggestions.map((address: string, index: number) => (
                    <CommandItem
                      key={index}
                      value={address}
                      onSelect={() => handleSelect(address)}
                      className="flex items-start gap-2 p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-gray-700 font-medium">{address}</div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="text-sm text-muted-foreground mt-1">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Start typing to see UK address suggestions, or enter a custom address
        </span>
      </p>
    </div>
  );
}