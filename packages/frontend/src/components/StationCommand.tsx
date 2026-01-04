import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useStationSearch } from '../hooks/useStations';
import { useRecentStops } from '../hooks/useRecent';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import type { Stop } from '@chicagorail/shared';

interface StationCommandProps {
  onSelectStation: (stop: Stop | null) => void;
  placeholder?: string;
  selectedStation?: Stop | null;
  label?: string;
  variant?: 'default' | 'secondary';
}

export function StationCommand({
  onSelectStation,
  placeholder = "Search for a station...",
  selectedStation,
  label,
  variant = 'default'
}: StationCommandProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { stops, loading } = useStationSearch(inputValue);
  const { recentStops, addRecentStop } = useRecentStops();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset input to selected station name when closing
        if (selectedStation) {
          setInputValue(selectedStation.stop_name);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedStation]);

  // Update input value when selected station changes externally
  useEffect(() => {
    if (selectedStation) {
      setInputValue(selectedStation.stop_name);
      setIsOpen(false);
    } else {
      setInputValue('');
    }
  }, [selectedStation]);

  const handleSelect = (stop: Stop) => {
    addRecentStop(stop);
    onSelectStation(stop);
    setInputValue(stop.stop_name);
    setIsOpen(false);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    // Clear input when focusing to search, but don't clear the station yet
    if (selectedStation) {
      setInputValue('');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue('');
    onSelectStation(null);
    setIsOpen(false);
  };

  const showSearchResults = inputValue.length >= 2;
  const showRecent = !showSearchResults && recentStops.length > 0 && isOpen;
  const showDropdown = isOpen && (showSearchResults || showRecent);

  const isSecondary = variant === 'secondary';

  return (
    <div className={`relative ${showDropdown ? 'z-50' : ''}`} ref={containerRef}>
      {label && (
        <label className={`block text-sm font-medium mb-1.5 ${isSecondary ? 'text-muted-foreground' : ''}`}>
          {label}
        </label>
      )}
      <Command className={`rounded-lg border overflow-visible ${isSecondary ? 'border-dashed' : 'shadow-md'}`} shouldFilter={false}>
        <div className="relative">
          <CommandInput
            placeholder={placeholder}
            value={inputValue}
            onValueChange={handleInputChange}
            onFocus={handleInputFocus}
            className={isSecondary ? 'text-muted-foreground' : ''}
          />
          {selectedStation && !isOpen && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-accent transition-colors"
              aria-label="Clear station"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        {showDropdown && (
          <CommandList className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[300px] rounded-lg border bg-popover shadow-lg">
            {showSearchResults && (
              <>
                {loading ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : stops.length === 0 ? (
                  <CommandEmpty>No stations found.</CommandEmpty>
                ) : (
                  <CommandGroup heading="Stations">
                    {stops.map((stop) => (
                      <CommandItem
                        key={stop.stop_id}
                        value={stop.stop_id}
                        onSelect={() => handleSelect(stop)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{stop.stop_name}</span>
                          {stop.stop_desc && (
                            <span className="text-xs text-muted-foreground">
                              {stop.stop_desc}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}

            {showRecent && (
              <CommandGroup heading="Recent Searches">
                {recentStops.map((stop) => (
                  <CommandItem
                    key={stop.stop_id}
                    value={stop.stop_id}
                    onSelect={() => handleSelect(stop)}
                  >
                    <span className="font-medium">{stop.stop_name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        )}
      </Command>
    </div>
  );
}
