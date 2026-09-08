/**
 * Trip planner card: From / To / Date
 *
 * The single input surface on the home screen. Leaving the destination empty
 * asks for a departures board; filling it asks for a trip.
 */

import { useState } from 'react';
import { ArrowLeftRight, CalendarDays, Search, X } from 'lucide-react';
import { format, isWeekend } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Chip } from '@/components/Chip';
import { useStationPicker } from '@/hooks/useStationPicker';
import { APP_CONFIG } from '@/config';
import type { Route, Stop } from '@chicagorail/shared';

interface TripPlannerProps {
  fromStop: Stop | null;
  toStop: Stop | null;
  fromRoutes: Route[];
  selectedDate: Date;
  isToday: boolean;
  isTomorrow: boolean;
  onDateChange: (date: Date | undefined) => void;
  onClearTo: () => void;
  onSwap: () => void;
}

const labelClass =
  'text-[10.5px] font-semibold uppercase tracking-[.1em] text-muted-foreground';

export function TripPlanner({
  fromStop,
  toStop,
  fromRoutes,
  selectedDate,
  isToday,
  isTomorrow,
  onDateChange,
  onClearTo,
  onSwap,
}: TripPlannerProps) {
  const openPicker = useStationPicker();
  const canSwap = !!fromStop && !!toStop;

  return (
    <div className="overflow-hidden rounded-[14px] border border-hairline-strong bg-surface">
      <button
        type="button"
        onClick={() => openPicker('from')}
        className="grid w-full grid-cols-[52px_minmax(0,1fr)] items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-foreground/[.035]"
      >
        <span className={labelClass}>From</span>
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            className={`truncate text-base font-semibold tracking-[-0.02em] ${
              fromStop ? '' : 'font-medium text-muted-foreground'
            }`}
          >
            {fromStop?.stop_name ?? 'Choose a station'}
          </span>
          {fromRoutes.length > 0 && (
            <span className="flex flex-none gap-[3px]" aria-hidden="true">
              {fromRoutes.map((route) => (
                <span
                  key={route.route_id}
                  className="h-4 w-[7px] rounded-[3px]"
                  style={{ backgroundColor: `#${route.route_color}` }}
                />
              ))}
            </span>
          )}
        </span>
      </button>

      <div className="relative mx-4 h-px bg-hairline">
        <button
          type="button"
          onClick={onSwap}
          disabled={!canSwap}
          aria-label="Swap origin and destination"
          className="absolute right-0 top-[-15px] flex size-[30px] items-center justify-center rounded-[9px] border border-hairline-strong bg-surface transition-colors hover:bg-surface-raised disabled:opacity-40 disabled:hover:bg-surface"
        >
          <ArrowLeftRight className="size-[14px] text-ink-subtle" />
        </button>
      </div>

      <div className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5">
        <span className={labelClass}>To</span>
        <button
          type="button"
          onClick={() => openPicker('to')}
          className="-my-2 flex min-w-0 items-center gap-2.5 py-2 text-left"
        >
          <Search className="size-[15px] flex-none text-muted-foreground" />
          <span
            className={`truncate text-base ${
              toStop ? 'font-semibold tracking-[-0.02em]' : 'font-medium text-muted-foreground'
            }`}
          >
            {toStop?.stop_name ?? 'Anywhere'}
          </span>
        </button>
        {toStop && (
          <button
            type="button"
            onClick={onClearTo}
            aria-label="Clear destination"
            className="flex size-[22px] items-center justify-center rounded-md bg-foreground/[.07] transition-colors hover:bg-foreground/[.14]"
          >
            <X className="size-[11px] text-ink-subtle" strokeWidth={2.4} />
          </button>
        )}
      </div>

      <div className="mx-4 h-px bg-hairline" />

      <div className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-3 px-4 py-3">
        <span className={labelClass}>Date</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip selected={isToday} onClick={() => onDateChange(new Date())}>
            Today
          </Chip>
          <Chip
            selected={isTomorrow}
            onClick={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              onDateChange(tomorrow);
            }}
          >
            Tomorrow
          </Chip>
          <DateChip selectedDate={selectedDate} isPreset={isToday || isTomorrow} onDateChange={onDateChange} />
          <span className="ml-auto self-center text-[11.5px] text-muted-foreground">
            {isWeekend(selectedDate) ? 'Weekend' : 'Weekday'} schedule
          </span>
        </div>
      </div>
    </div>
  );
}

interface DateChipProps {
  selectedDate: Date;
  isPreset: boolean;
  onDateChange: (date: Date | undefined) => void;
}

function DateChip({ selectedDate, isPreset, onDateChange }: DateChipProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Chip selected={!isPreset}>
          <CalendarDays className="size-3" />
          {isPreset ? 'Pick a date' : format(selectedDate, APP_CONFIG.dateFormats.datePicker)}
        </Chip>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          captionLayout="dropdown"
          onSelect={(date) => {
            onDateChange(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
