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
  const { data: suggestions = [] } = useQuery({
    queryKey: ["/api/search-addresses", searchQuery],
    queryFn: () => apiRequest("GET", `/api/search-addresses?q=${encodeURIComponent(searchQuery)}&limit=8`),
    enabled: searchQuery.length >= 2 && open,
  });

  const handleSelect = (selectedAddress: string) => {
    onChange(selectedAddress);
    setOpen(false);
    textareaRef.current?.focus();
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    if (newValue.length >= 2) {
      setOpen(true);
    } else {
      setOpen(false);
    }
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
                if (value.length >= 2) {
                  setOpen(true);
                }
              }}
            />
            <MapPin className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" side="bottom" align="start">
          <Command>
            <CommandInput 
              placeholder="Search UK addresses..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="hidden"
            />
            <CommandList>
              <CommandEmpty>No addresses found.</CommandEmpty>
              <CommandGroup>
                {suggestions.map((address: string, index: number) => (
                  <CommandItem
                    key={index}
                    value={address}
                    onSelect={() => handleSelect(address)}
                    className="flex items-start gap-2 p-3 cursor-pointer"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="text-sm">{address}</div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="text-sm text-muted-foreground mt-1">
        Start typing to see address suggestions, or enter a custom address
      </p>
    </div>
  );
}