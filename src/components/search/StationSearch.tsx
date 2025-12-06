import { useState, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Stop, Route } from '@/types/metra';

interface StationSearchProps {
  onStationSelect: (station: Stop, routes: Route[]) => void;
  selectedStation: Stop | null;
}

export function StationSearch({ onStationSelect, selectedStation }: StationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ stops: Stop[]; routes: Route[] }>({
    stops: [],
    routes: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search function
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsLoading(true);
        try {
          const results = await api.searchStops(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Error searching stops:', error);
          setSearchResults({ stops: [], routes: [] });
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults({ stops: [], routes: [] });
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSelect = useCallback((stop: Stop) => {
    // Find routes serving this stop
    const routesForStop = searchResults.routes.filter(route =>
      searchResults.stops.some(s => s.stop_id === stop.stop_id)
    );
    onStationSelect(stop, routesForStop);
    setSearchQuery('');
    setSearchResults({ stops: [], routes: [] });
  }, [searchResults, onStationSelect]);

  return (
    <div className="w-full">
      <Card className="w-full">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search for a station..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            )}
            {!isLoading && searchQuery.trim().length >= 2 && searchResults.stops.length === 0 && (
              <CommandEmpty>No stations found.</CommandEmpty>
            )}
            {!isLoading && searchResults.stops.length > 0 && (
              <CommandGroup heading="Stations">
                {searchResults.stops.map((stop) => (
                  <CommandItem
                    key={stop.stop_id}
                    value={stop.stop_id}
                    onSelect={() => handleSelect(stop)}
                    className="cursor-pointer"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    <span className="flex-1">{stop.stop_name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {stop.stop_id}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </Card>

      {selectedStation && (
        <div className="mt-4">
          <Badge variant="default" className="text-sm">
            Selected: {selectedStation.stop_name}
          </Badge>
        </div>
      )}
    </div>
  );
}
