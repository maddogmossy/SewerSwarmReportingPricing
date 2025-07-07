import { useState, useEffect, useRef } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  // Fetch address suggestions
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["/api/search-addresses", searchQuery],
    queryFn: () => apiRequest("GET", `/api/search-addresses?q=${encodeURIComponent(searchQuery)}&limit=8`),
    enabled: searchQuery.length >= 1,
  });

  // Show suggestions when data is available
  useEffect(() => {
    if (suggestions.length > 0 && value.length >= 1) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [suggestions, value]);

  const handleSelect = (selectedAddress: string) => {
    onChange(selectedAddress);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    if (newValue.length >= 1) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className={className}>
      <Label htmlFor="address-input">{label}</Label>
      <div className="relative">
        <Textarea
          ref={textareaRef}
          id="address-input"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[100px] pr-10"
          onFocus={() => {
            if (value.length >= 1 && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay hiding to allow click on suggestions
            setTimeout(() => setShowSuggestions(false), 200);
          }}
        />
        <MapPin className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        
        {/* Suggestions dropdown */}
        {showSuggestions && (suggestions.length > 0 || isLoading) && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[200px] overflow-y-auto">
            {isLoading ? (
              <div className="p-3 text-sm text-gray-500">Loading suggestions...</div>
            ) : (
              suggestions.map((address: string, index: number) => (
                <div
                  key={index}
                  onMouseDown={() => handleSelect(address)} // Use onMouseDown to prevent blur
                  className="flex items-start gap-2 p-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                >
                  <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700 font-medium">{address}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Start typing to see UK address suggestions, or enter a custom address
        </span>
      </p>
    </div>
  );
}