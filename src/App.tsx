import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { MetraService } from './services/metraService';
import RouteList from './components/RouteList';
import { ScheduleView } from './components/ScheduleView';
import { Route } from './types/metra';

function App() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const metraService = MetraService.getInstance();

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsDatePickerOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold text-gray-900"
            >
              Metra Schedule
            </motion.h1>
            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <span>{format(selectedDate, 'MMM d, yyyy')}</span>
                <svg
                  className={`w-5 h-5 transform transition-transform ${isDatePickerOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <AnimatePresence>
                {isDatePickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 bg-white rounded-lg shadow-xl p-4 z-50 border border-gray-100"
                  >
                    <DayPicker
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      className="border-none"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-gray-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                        day_selected: "bg-primary-600 text-white hover:bg-primary-700 focus:bg-primary-700",
                        day_today: "bg-gray-100 text-gray-900",
                        day_outside: "text-gray-400 opacity-50",
                        day_disabled: "text-gray-400 opacity-50",
                        day_range_middle: "aria-selected:bg-gray-100 aria-selected:text-gray-900",
                        day_hidden: "invisible",
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Route List */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <RouteList
              onRouteSelect={handleRouteSelect}
              selectedRoute={selectedRoute}
            />
          </motion.div>

          {/* Schedule View */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-9"
          >
            <AnimatePresence mode="wait">
              {selectedRoute ? (
                <motion.div
                  key={selectedRoute.route_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ScheduleView
                    selectedRoute={selectedRoute.route_id}
                    selectedDate={selectedDate}
                  />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="card text-center py-12"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Route</h2>
                  <p className="text-gray-600">Choose a route from the list to view its schedule</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default App;
