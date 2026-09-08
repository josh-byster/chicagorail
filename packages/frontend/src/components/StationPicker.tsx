/**
 * Station search modal
 *
 * A command palette that can be opened from anywhere (header, trip planner,
 * departures board). Selecting a station writes it to the `from` or `to` URL
 * param and returns to the results view.
 */

import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, X } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { useStationSearch } from '@/hooks/useStations';
import {
  StationPickerContext,
  type OpenPicker,
  type StationField,
} from '@/hooks/useStationPicker';
import { useRecentStops } from '@/hooks/useRecent';
import { APP_CONFIG } from '@/config';
import type { Stop } from '@chicagorail/shared';

export function StationPickerProvider({ children }: { children: React.ReactNode }) {
  const [field, setField] = useState<StationField | null>(null);
  const [keepPlanning, setKeepPlanning] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addRecentStop } = useRecentStops();

  const open = useCallback<OpenPicker>((next, options) => {
    setQuery('');
    setKeepPlanning(!!options?.keepPlanning);
    setField(next);
  }, []);

  const close = useCallback(() => setField(null), []);

  const handleSelect = useCallback(
    (stop: Stop) => {
      if (!field) return;
      addRecentStop(stop);

      const params = new URLSearchParams(searchParams);
      params.set(field, stop.stop_id);
      params.delete('route');
      if (keepPlanning) {
        params.set('view', 'plan');
      } else {
        params.delete('view');
      }

      close();
      navigate({ pathname: '/', search: params.toString() });
    },
    [field, keepPlanning, addRecentStop, searchParams, navigate, close]
  );

  const label = field === 'to' ? 'Search for a destination' : 'Search for a station';

  return (
    <StationPickerContext.Provider value={open}>
      {children}
      <Dialog.Root open={field !== null} onOpenChange={(next) => !next && close()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[3px]" />
          <Dialog.Content
            aria-label={label}
            className="fixed inset-x-0 top-[12vh] z-50 mx-auto flex max-h-[76vh] w-[calc(100%-40px)] max-w-[480px] flex-col overflow-hidden rounded-[14px] border border-border bg-popover shadow-[0_30px_80px_-20px_rgba(0,0,0,.55)] dark:shadow-[0_30px_80px_-20px_rgba(0,0,0,.95)]"
          >
            <Dialog.Title className="sr-only">{label}</Dialog.Title>
            <StationPickerBody
              query={query}
              onQueryChange={setQuery}
              onSelect={handleSelect}
              onClose={close}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </StationPickerContext.Provider>
  );
}

interface StationPickerBodyProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (stop: Stop) => void;
  onClose: () => void;
}

function StationPickerBody({ query, onQueryChange, onSelect, onClose }: StationPickerBodyProps) {
  const { data: stops, isLoading, error } = useStationSearch(query);
  const { data: recentStops } = useRecentStops();

  const hasQuery = query.length >= APP_CONFIG.search.minQueryLength;
  const searchComplete = hasQuery && !isLoading;
  const showRecent = !hasQuery && recentStops.length > 0;

  // cmdk needs a stable value per item; stop ids are unique per group
  const results = useMemo(() => (searchComplete ? stops : []), [searchComplete, stops]);

  return (
    <Command className="bg-transparent" shouldFilter={false}>
      <div className="flex items-center gap-[11px] border-b border-hairline px-[18px] py-4">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search stations"
          aria-label="Search stations"
          className="min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="ml-auto flex size-[22px] items-center justify-center rounded-md bg-foreground/[.07] transition-colors hover:bg-foreground/[.14]"
        >
          <X className="size-[11px] text-ink-subtle" strokeWidth={2.4} />
        </button>
      </div>

      <CommandList className="max-h-none flex-1 overflow-y-auto py-[10px]">
        {hasQuery && error && (
          <div className="px-[18px] py-6 text-center text-sm text-destructive">
            Search failed. Please try again.
          </div>
        )}

        {hasQuery && !error && (
          <CommandGroup
            heading="Stations"
            className="p-0 [&_[cmdk-group-heading]]:px-[18px] [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[.1em] [&_[cmdk-group-heading]]:text-muted-foreground"
          >
            {results.map((stop) => (
              <StationRow key={stop.stop_id} stop={stop} onSelect={onSelect} />
            ))}
            {searchComplete && results.length === 0 && (
              <CommandEmpty className="px-[18px] py-6 text-center text-sm text-muted-foreground">
                No stations found.
              </CommandEmpty>
            )}
          </CommandGroup>
        )}

        {showRecent && (
          <CommandGroup
            heading="Recent"
            className="p-0 [&_[cmdk-group-heading]]:px-[18px] [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[.1em] [&_[cmdk-group-heading]]:text-muted-foreground"
          >
            {recentStops.map((stop) => (
              <StationRow key={stop.stop_id} stop={stop} onSelect={onSelect} />
            ))}
          </CommandGroup>
        )}

        {!hasQuery && !showRecent && (
          <p className="px-[18px] py-6 text-center text-sm text-muted-foreground">
            Type at least {APP_CONFIG.search.minQueryLength} characters to search.
          </p>
        )}
      </CommandList>

      <div className="flex gap-[14px] border-t border-hairline bg-foreground/[.02] px-[18px] py-[11px] text-[11.5px] text-muted-foreground">
        <span>Arrow keys to move</span>
        <span>Enter to select</span>
        <span>Esc to close</span>
      </div>
    </Command>
  );
}

function StationRow({ stop, onSelect }: { stop: Stop; onSelect: (stop: Stop) => void }) {
  return (
    <CommandItem
      value={stop.stop_id}
      onSelect={() => onSelect(stop)}
      className="cursor-pointer rounded-none px-[18px] py-2.5 data-[selected=true]:bg-foreground/[.045] data-[selected=true]:text-foreground"
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">{stop.stop_name}</span>
        {stop.stop_desc && (
          <span className="truncate text-xs text-muted-foreground">{stop.stop_desc}</span>
        )}
      </div>
    </CommandItem>
  );
}
