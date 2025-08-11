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

  // Fetch address suggestions - using direct fetch with proper error handling
  const { data: rawSuggestions, isLoading } = useQuery({
    queryKey: ["/api/search-addresses", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 1) return [];
      
      try {
        console.log("Fetching suggestions for:", searchQuery);
        const response = await fetch(`/api/search-addresses?q=${encodeURIComponent(searchQuery)}&limit=8`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log("Raw API response:", result);
        console.log("Parsed suggestions:", result);
        console.log("Is array?", Array.isArray(result));
        
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        return [];
      }
    },
    enabled: searchQuery.length >= 1,
  });

  const suggestions = Array.isArray(rawSuggestions) ? rawSuggestions : [];
  console.log("Final suggestions array:", suggestions);

  // Show suggestions when data is available
  useEffect(() => {
    console.log("Address autocomplete state:", { 
      suggestions: suggestions.length, 
      value: value.length, 
      showSuggestions,
      searchQuery 
    });
    if (suggestions.length > 0 && value.length >= 1) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [suggestions, value, showSuggestions, searchQuery]);

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
        
        {/* Suggestions dropdown - always visible for debugging */}
        {(showSuggestions || value.length >= 1) && (suggestions.length > 0 || isLoading) && (
          <div 
            className="absolute z-[9999] w-full mt-1 bg-white border-2 border-blue-300 rounded-md shadow-2xl max-h-[200px] overflow-y-auto"
            style={{ 
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 9999,
              backgroundColor: 'white',
              border: '2px solid #3b82f6'
            }}
          >
            {isLoading ? (
              <div className="p-3 text-sm text-gray-500 bg-yellow-100">Loading suggestions...</div>
            ) : suggestions.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 bg-red-100">No suggestions found</div>
            ) : (
              suggestions.map((address: string, index: number) => (
                <div
                  key={index}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    console.log("Clicking suggestion:", address);
                    handleSelect(address);
                  }}
                  className="flex items-start gap-2 p-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 bg-green-50"
                >
                  <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700 font-bold">{address}</div>
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