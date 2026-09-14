/**
 * Station search modal
 *
 * A command palette that can be opened from anywhere (header, trip planner,
 * departures board). Selecting a station writes it to the `from` or `to` URL
 * param and returns to the results view.
 */

import { useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import { Command as CommandPrimitive } from 'cmdk';
import { api } from '@/lib/api';
import { useTripParams } from '@/hooks/useTripParams';
import { cn } from '@/lib/utils';
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
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addRecentStop } = useRecentStops();

  const open = useCallback<OpenPicker>((next) => {
    setQuery('');
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

      close();
      navigate({ pathname: '/', search: params.toString() });
    },
    [field, addRecentStop, searchParams, navigate, close]
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
            aria-describedby={undefined}
            className="fixed inset-x-0 top-[12vh] z-50 mx-auto flex max-h-[76vh] w-[calc(100%-40px)] max-w-[480px] flex-col overflow-hidden rounded-[14px] border border-border bg-popover shadow-[0_30px_80px_-20px_rgba(0,0,0,.55)] dark:shadow-[0_30px_80px_-20px_rgba(0,0,0,.95)]"
          >
            <Dialog.Title className="sr-only">{label}</Dialog.Title>
            <StationPickerBody
              field={field ?? 'from'}
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
  field: StationField;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (stop: Stop) => void;
  onClose: () => void;
}

function StationPickerBody({ field, query, onQueryChange, onSelect, onClose }: StationPickerBodyProps) {
  const { fromId, toId, dateString } = useTripParams();
  const fixedId = field === 'to' ? fromId : toId;
  const connections = useQuery({
    queryKey: ['stop-connections', fixedId, field, dateString],
    queryFn: ({ signal }) => api.getStopConnections(fixedId!, field, dateString, { signal }),
    enabled: !!fixedId,
    staleTime: 60_000,
  });
  const { data: stops, isLoading, error } = useStationSearch(fixedId && !connections.isError ? '' : query);
  const { data: recentStops } = useRecentStops();
  const hasQuery = query.trim().length >= APP_CONFIG.search.minQueryLength;
  const eligibleIds = new Set(connections.data?.eligibleStopIds);
  const matching = connections.data?.stops.filter(stop =>
    stop.stop_name.toLowerCase().includes(query.trim().toLowerCase())
  ) ?? [];
  const available = matching.filter(stop => eligibleIds.has(stop.stop_id));
  const unavailable = matching.filter(stop => !eligibleIds.has(stop.stop_id));
  const groupClass = 'p-0 [&_[cmdk-group-heading]]:px-[18px] [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground';

  return (
    <Command className="bg-transparent" shouldFilter={false}>
      <div className="flex items-center gap-[11px] border-b border-hairline px-[18px] py-4">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <CommandPrimitive.Input
          autoFocus
          value={query}
          onValueChange={onQueryChange}
          placeholder="Search stations"
          aria-label="Search stations"
          className="min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-foreground/[.07]"
        >
          <X className="size-[14px] text-ink-subtle" />
        </button>
      </div>

      {connections.data && (
        <p className="border-b border-hairline px-[18px] py-3 text-xs text-muted-foreground">
          Direct trains {field === 'to' ? 'from' : 'to'}{' '}
          <strong className="font-medium text-foreground">{connections.data.stop.stop_name}</strong>
          {' · '}{dateString}. Availability covers the whole day.
        </p>
      )}
      <CommandList className="max-h-none flex-1 overflow-y-auto py-[10px]">
        {fixedId && connections.isPending && (
          <p role="status" className="px-[18px] py-6 text-center text-sm text-muted-foreground">Checking direct connections…</p>
        )}
        {fixedId && connections.isError && (
          <div role="status" className="flex flex-col gap-2 px-[18px] py-3 text-sm text-muted-foreground">
            <p>Couldn’t check connections. You can still search all stations.</p>
            <button type="button" onClick={() => connections.refetch()} className="self-start underline underline-offset-4">Try again</button>
          </div>
        )}
        {connections.data ? (
          <>
            {available.length > 0 && (
              <CommandGroup heading="Direct connections" className={groupClass}>
                {available.map(stop => <StationRow key={stop.stop_id} stop={stop} onSelect={onSelect} />)}
              </CommandGroup>
            )}
            {available.length === 0 && (
              <p role="status" className="px-[18px] py-3 text-sm text-muted-foreground">
                {query.trim() ? 'No matching direct connections.' : 'No direct trains on this date. Try another date.'}
              </p>
            )}
            {unavailable.length > 0 && (
              <CommandGroup heading="Unavailable for this trip" className={groupClass}>
                {unavailable.map(stop => (
                  <StationRow key={stop.stop_id} stop={stop} onSelect={onSelect}
                    unavailableReason={stop.stop_id === fixedId ? 'Same station' : 'No direct train on this date'} />
                ))}
              </CommandGroup>
            )}
          </>
        ) : (!fixedId || connections.isError) && (
          <>
            {hasQuery && isLoading && <p role="status" className="px-[18px] py-6 text-sm text-muted-foreground">Searching stations…</p>}
            {hasQuery && error && <p role="status" className="px-[18px] py-6 text-sm text-destructive">Search failed. Please try again.</p>}
            {hasQuery && !error && !isLoading && (
              <CommandGroup heading="Stations" className={groupClass}>
                {stops.map(stop => <StationRow key={stop.stop_id} stop={stop} onSelect={onSelect} />)}
                {stops.length === 0 && <CommandEmpty>No stations found.</CommandEmpty>}
              </CommandGroup>
            )}
            {!hasQuery && recentStops.length > 0 && (
              <CommandGroup heading="Recent" className={groupClass}>
                {recentStops.map(stop => <StationRow key={stop.stop_id} stop={stop} onSelect={onSelect} />)}
              </CommandGroup>
            )}
            {!hasQuery && recentStops.length === 0 && (
              <p className="px-[18px] py-6 text-center text-sm text-muted-foreground">Type at least {APP_CONFIG.search.minQueryLength} characters to search.</p>
            )}
          </>
        )}
      </CommandList>

      <div className="flex flex-wrap gap-[14px] border-t border-hairline bg-foreground/[.02] px-[18px] py-[11px] text-[11.5px] text-muted-foreground">
        <span>Arrow keys to move</span><span>Enter to select</span><span>Esc to close</span>
      </div>
    </Command>
  );
}

function StationRow({ stop, onSelect, unavailableReason }: {
  stop: Stop;
  onSelect: (stop: Stop) => void;
  unavailableReason?: string;
}) {
  return (
    <CommandItem
      value={stop.stop_id}
      disabled={!!unavailableReason}
      onSelect={() => { if (!unavailableReason) onSelect(stop); }}
      className="cursor-pointer rounded-none px-[18px] py-2.5 data-[selected=true]:bg-foreground/[.045] data-[selected=true]:text-foreground data-[disabled=true]:opacity-100"
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className={cn('truncate text-sm font-medium', unavailableReason && 'text-muted-foreground line-through')}>{stop.stop_name}</span>
        {(unavailableReason || stop.stop_desc) && (
          <span className="text-xs text-muted-foreground">{unavailableReason || stop.stop_desc}</span>
        )}
      </div>
    </CommandItem>
  );
}
