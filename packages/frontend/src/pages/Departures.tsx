import { useState } from 'react';
import { format } from 'date-fns';
import { StationCommand } from '../components/StationCommand';
import { DepartureBoard } from '../components/DepartureBoard';
import { LineFilter } from '../components/LineFilter';
import { DatePicker } from '../components/DatePicker';
import { Button } from '../components/ui/button';
import type { Stop } from '@chicagorail/shared';

export function Departures() {
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [routeFilter, setRouteFilter] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const isToday = format(new Date(), 'yyyy-MM-dd') === dateString;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">View Departures</h2>
          <p className="text-muted-foreground">
            Search for a station to see upcoming train departures
          </p>
        </div>

        <div className="space-y-6">
          <StationCommand
            onSelectStation={setSelectedStop}
            selectedStation={selectedStop}
          />

          {selectedStop && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DatePicker
                  date={selectedDate}
                  onDateChange={(date) => date && setSelectedDate(date)}
                />
                {!isToday && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Today
                  </Button>
                )}
              </div>
              <LineFilter
                onFilterChange={setRouteFilter}
                stopId={selectedStop.stop_id}
                date={dateString}
              />
              <DepartureBoard
                stopId={selectedStop.stop_id}
                routeFilter={routeFilter}
                date={dateString}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
