/**
 * Station search command palette
 *
 * Features:
 * - Fuzzy search for stations
 * - Recent searches display
 * - Keyboard navigation via cmdk
 */

import { useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { useStationSearch } from '@/hooks/useStations';
import { useRecentStops } from '@/hooks/useRecent';
import { APP_CONFIG } from '@/config';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
  placeholder = 'Search for a station...',
  selectedStation,
  label,
  variant = 'default',
}: StationCommandProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: stops, isLoading, error } = useStationSearch(searchQuery);
  const { data: recentStops, addRecentStop } = useRecentStops();

  // Derive display value: show search query when searching, otherwise show selected station
  const displayValue = isSearching ? searchQuery : selectedStation?.stop_name ?? '';

  const closeDropdown = useCallback(() => {
    setIsSearching(false);
    setSearchQuery('');
  }, []);

  const handleSelect = useCallback(
    (stop: Stop) => {
      addRecentStop(stop);
      onSelectStation(stop);
      closeDropdown();
    },
    [addRecentStop, onSelectStation, closeDropdown]
  );

  const handleInputChange = useCallback((value: string) => {
    setSearchQuery(value);
    setIsSearching(true);
  }, []);

  const handleInputFocus = useCallback(() => {
    setIsSearching(true);
    setSearchQuery('');
  }, []);

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectStation(null);
      closeDropdown();
    },
    [onSelectStation, closeDropdown]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      // Only close if focus moved outside container
      if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
        closeDropdown();
      }
    },
    [closeDropdown]
  );

  const showSearchResults = searchQuery.length >= APP_CONFIG.search.minQueryLength;
  const showRecent = !showSearchResults && recentStops.length > 0 && isSearching;
  const showDropdown = isSearching && (showSearchResults || showRecent);

  const isSecondary = variant === 'secondary';

  return (
    <div
      className={`relative ${showDropdown ? 'z-50' : ''}`}
      ref={containerRef}
      onBlur={handleBlur}
    >
      {label && (
        <label
          className={`block text-sm font-medium mb-1.5 ${isSecondary ? 'text-muted-foreground' : ''}`}
        >
          {label}
        </label>
      )}
      <Command
        className={`rounded-lg border overflow-visible ${isSecondary ? 'border-dashed' : 'shadow-md'}`}
        shouldFilter={false}
      >
        <div className="relative">
          <CommandInput
            placeholder={placeholder}
            value={displayValue}
            onValueChange={handleInputChange}
            onFocus={handleInputFocus}
            className={isSecondary ? 'text-muted-foreground' : ''}
          />
          {selectedStation && !isSearching && (
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
                {isLoading ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
                ) : error ? (
                  <div className="py-6 text-center text-sm text-red-600 dark:text-red-400">
                    Search failed. Please try again.
                  </div>
                ) : stops.length === 0 ? (
                  <CommandEmpty>No stations found.</CommandEmpty>
                ) : (
                  <CommandGroup heading="Stations">
                    {stops.map((stop) => (
                      <CommandItem key={stop.stop_id} value={stop.stop_id} onSelect={() => handleSelect(stop)}>
                        <div className="flex flex-col">
                          <span className="font-medium">{stop.stop_name}</span>
                          {stop.stop_desc && (
                            <span className="text-xs text-muted-foreground">{stop.stop_desc}</span>
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
                  <CommandItem key={stop.stop_id} value={stop.stop_id} onSelect={() => handleSelect(stop)}>
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
