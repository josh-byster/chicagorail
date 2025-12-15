import { useState } from 'react';
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
  onSelectStation: (stop: Stop) => void;
  placeholder?: string;
  selectedStation?: Stop | null;
}

export function StationCommand({
  onSelectStation,
  placeholder = "Search for a station...",
  selectedStation
}: StationCommandProps) {
  const [inputValue, setInputValue] = useState('');
  const { stops, loading } = useStationSearch(inputValue);
  const { recentStops, addRecentStop } = useRecentStops();

  const handleSelect = (stop: Stop) => {
    addRecentStop(stop);
    onSelectStation(stop);
    setInputValue('');
  };

  const showSearchResults = inputValue.length >= 2;
  const showRecent = !showSearchResults && recentStops.length > 0;

  return (
    <Command className="rounded-lg border shadow-md" shouldFilter={false}>
      <CommandInput
        placeholder={placeholder}
        value={inputValue}
        onValueChange={setInputValue}
      />
      <CommandList>
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
    </Command>
  );
}
