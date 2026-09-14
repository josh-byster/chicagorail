import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { addDays, format, isToday, subDays } from 'date-fns';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Map,
} from 'lucide-react';
import RouteList from './components/RouteList';
import { ScheduleView } from './components/ScheduleView';
import { Route, Stop } from './types/metra';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

function App() {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedStation, setSelectedStation] = useState<Stop | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setIsDatePickerOpen(false);
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="page-width header-inner">
          <a className="brand" href="/" aria-label="Chicago Rail home">
            <span className="brand-mark" aria-hidden="true"><span /><span /></span>
            <span><strong>Chicago Rail</strong><small>Metra schedule explorer</small></span>
          </a>
          <div className="status-pill"><span /> Schedule data</div>
        </div>
      </header>

      <main className="page-width main-content">
        <section className="page-intro" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">Plan your ride</p>
            <h1 id="page-title">Find the train that fits your day.</h1>
            <p>Search for the line—or just enter a station you know—and see every departure in one place.</p>
          </div>

          <div className="date-control">
            <span className="control-label">Travel date</span>
            <div className="date-control-row">
              <Button variant="outline" size="icon-lg" type="button" aria-label="Previous day" onClick={() => setSelectedDate((date) => subDays(date, 1))}>
                <ChevronLeft />
              </Button>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="lg" className="min-h-[58px] flex-1 justify-start gap-3 px-3 text-left">
                    <CalendarDays data-icon="inline-start" />
                    <span className="grid flex-1">
                      <strong>{isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')}</strong>
                      <small>{format(selectedDate, 'MMM d, yyyy')}</small>
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-0">
                  <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} autoFocus />
                  {!isToday(selectedDate) && (
                    <>
                      <Separator />
                      <Button variant="ghost" className="w-full" onClick={() => handleDateSelect(new Date())}>Jump to today</Button>
                    </>
                  )}
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="icon-lg" type="button" aria-label="Next day" onClick={() => setSelectedDate((date) => addDays(date, 1))}>
                <ChevronRight />
              </Button>
            </div>
          </div>
        </section>

        <div className="planner-layout">
          <aside className="route-panel" aria-label="Choose a Metra line">
            <div className="panel-heading">
              <span className="step-number">1</span>
              <div><p className="eyebrow">First</p><h2>Find your line</h2></div>
            </div>
            <RouteList
              onRouteSelect={(route, station) => {
                setSelectedRoute(route);
                setSelectedStation(station || null);
              }}
              selectedRoute={selectedRoute}
            />
          </aside>

          <section className="schedule-panel" aria-live="polite">
            <AnimatePresence mode="wait">
              {selectedRoute ? (
                <motion.div key={selectedRoute.route_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <ScheduleView selectedRoute={selectedRoute} selectedDate={selectedDate} selectedStation={selectedStation} />
                </motion.div>
              ) : (
                <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Empty className="min-h-[536px]">
                    <EmptyHeader>
                      <EmptyMedia>
                        <div className="welcome-illustration" aria-hidden="true">
                          <Map /><span className="rail-line" /><span className="rail-stop rail-stop-one" /><span className="rail-stop rail-stop-two" /><span className="rail-stop rail-stop-three" />
                        </div>
                      </EmptyMedia>
                      <p className="eyebrow">Your schedule will appear here</p>
                      <EmptyTitle>Start with what you know.</EmptyTitle>
                      <EmptyDescription>Search for a line or type a station name. We’ll show you which Metra line serves it and the departures for {format(selectedDate, 'EEEE, MMMM d')}.</EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent><div className="selection-hint"><ChevronLeft /> Search by line or station</div></EmptyContent>
                  </Empty>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>

      <footer className="page-width site-footer">Schedule information is provided for planning. Check Metra for live service alerts.</footer>
    </div>
  );
}

export default App;
