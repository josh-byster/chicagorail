import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import type { Station } from '@metra/shared';

interface StationComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  stations: Station[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function StationCombobox({
  value,
  onChange,
  placeholder = 'Select station',
  disabled = false,
  stations,
  isLoading,
  error,
}: StationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  if (isLoading) {
    return <Skeleton className="h-11 w-full" />;
  }

  if (error) {
    return (
      <Button
        variant="outline"
        role="combobox"
        disabled
        className="w-full justify-between h-11 font-normal"
      >
        <span className="text-muted-foreground">Error loading stations</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  const selectedStation = stations?.find((station) => station.station_id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || !stations || stations.length === 0}
          className="w-full justify-between h-11 font-normal"
        >
          <span className={cn(!value && "text-muted-foreground")}>
            {selectedStation ? selectedStation.station_name : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search station..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No station found.</CommandEmpty>
            <CommandGroup>
              {stations?.map((station) => (
                <CommandItem
                  key={station.station_id}
                  value={station.station_name}
                  onSelect={() => {
                    onChange(station.station_id);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === station.station_id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {station.station_name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
