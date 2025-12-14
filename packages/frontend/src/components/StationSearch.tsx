import { useState } from 'react';
import { useStationSearch } from '../hooks/useStations';
import { useRecentStops } from '../hooks/useRecent';
import { Input } from './ui/input';
import type { Stop } from '@chicagorail/shared';

interface StationSearchProps {
  onSelectStation: (stop: Stop) => void;
  placeholder?: string;
}

export function StationSearch({ onSelectStation, placeholder = "Search for a station..." }: StationSearchProps) {
  const [query, setQuery] = useState('');
  const { stops, loading } = useStationSearch(query);
  const { recentStops, addRecentStop } = useRecentStops();

  const handleSelect = (stop: Stop) => {
    addRecentStop(stop);
    onSelectStation(stop);
    setQuery('');
  };

  const showResults = query.length >= 2;
  const showRecent = !showResults && recentStops.length > 0;

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full"
      />

      {showResults && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Searching...
            </div>
          ) : stops.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No stations found
            </div>
          ) : (
            stops.map((stop) => (
              <button
                key={stop.stop_id}
                className="w-full text-left px-4 py-2 hover:bg-accent transition-colors"
                onClick={() => handleSelect(stop)}
              >
                <div className="font-medium">{stop.stop_name}</div>
                {stop.stop_desc && (
                  <div className="text-xs text-muted-foreground">
                    {stop.stop_desc}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {showRecent && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2 text-muted-foreground">
            Recent Searches
          </h3>
          <div className="space-y-1">
            {recentStops.map((stop) => (
              <button
                key={stop.stop_id}
                className="w-full text-left px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
                onClick={() => handleSelect(stop)}
              >
                <div className="font-medium">{stop.stop_name}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
