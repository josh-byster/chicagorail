'use client';

import * as React from 'react';
import { Check, Train, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';

// Mock station data
const stations = [
  { value: 'union-station', label: 'Union Station' },
  { value: 'ogilvie', label: 'Ogilvie Transportation Center' },
  { value: 'lasalle-street', label: 'LaSalle Street Station' },
  { value: 'millennium-station', label: 'Millennium Station' },
  { value: 'route59', label: 'Route 59' },
  { value: 'aurora', label: 'Aurora' },
  { value: 'naperville', label: 'Naperville' },
  { value: 'lisle', label: 'Lisle' },
  { value: 'belmont', label: 'Belmont' },
  { value: 'clybourn', label: 'Clybourn' },
  { value: 'ravenswood', label: 'Ravenswood' },
  { value: 'rogers-park', label: 'Rogers Park' },
  { value: 'evanston', label: 'Evanston Davis' },
  { value: 'wilmette', label: 'Wilmette' },
];

type Step = 'origin' | 'destination';

export default function HomePageMockup() {
  const [step, setStep] = React.useState<Step>('origin');
  const [fromStation, setFromStation] = React.useState('');
  const [toStation, setToStation] = React.useState('');
  const [showResults, setShowResults] = React.useState(false);

  const handleFromSelect = (value: string) => {
    setFromStation(value);
  };

  const handleToSelect = (value: string) => {
    setToStation(value);
    setShowResults(true);
  };

  const handleBack = () => {
    setStep('origin');
    setFromStation('');
    setToStation('');
  };

  const handleReset = () => {
    setShowResults(false);
    setStep('origin');
    setFromStation('');
    setToStation('');
  };

  const fromStationData = stations.find((s) => s.value === fromStation);
  const toStationData = stations.find((s) => s.value === toStation);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 to-primary/5">
      {/* Navigation Bar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <a
                    href="/"
                    className="flex items-center gap-2 font-bold text-lg"
                  >
                    <Train className="h-5 w-5" />
                    Metro Tracker
                  </a>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Routes</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                    <li className="row-span-3">
                      <div className="text-sm font-medium">All Routes</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        View all available Metra routes
                      </p>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <a href="/schedules">Schedules</a>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <a href="/alerts">Alerts</a>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </nav>

      {/* Hero Section */}
      {!showResults && (
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Metro Tracker
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4">
              Real-time train tracking for your daily commute
            </p>
            <div className="h-1 w-24 bg-gradient-to-r from-primary to-blue-600 mx-auto rounded-full"></div>
          </div>

          {/* Search Card */}
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 shadow-xl bg-card/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                {step === 'origin' ? (
                  <div className="space-y-4">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                        Where do you want to go?
                      </h3>
                      {fromStationData && (
                        <p className="text-sm text-muted-foreground">
                          Currently selected:{' '}
                          <span className="font-semibold text-foreground">
                            {fromStationData.label}
                          </span>
                        </p>
                      )}
                    </div>

                    <Command className="rounded-lg border shadow-md">
                      <CommandInput
                        placeholder="Search for your station..."
                        className="text-base md:text-lg h-12"
                        autoFocus
                      />
                      <CommandList className="max-h-[400px]">
                        <CommandEmpty>No station found.</CommandEmpty>
                        <CommandGroup>
                          {stations.map((station) => (
                            <CommandItem
                              key={station.value}
                              value={station.label}
                              onSelect={() => handleFromSelect(station.value)}
                              className="cursor-pointer py-4 px-4 text-base md:text-lg aria-selected:bg-primary/10"
                            >
                              <Check
                                className={cn(
                                  'mr-3 h-5 w-5 transition-all duration-200',
                                  fromStation === station.value
                                    ? 'opacity-100 scale-100'
                                    : 'opacity-0 scale-75'
                                )}
                              />
                              {station.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>

                    {fromStation && (
                      <Button
                        onClick={() => setStep('destination')}
                        className="w-full h-12 text-base md:text-lg"
                        size="lg"
                      >
                        Continue to Destination
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBack}
                        aria-label="Go back"
                        className="shrink-0"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">From</p>
                        <p className="font-semibold text-foreground">
                          {fromStationData?.label}
                        </p>
                      </div>
                    </div>

                    <div className="text-center space-y-2">
                      <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                        Where are you headed to?
                      </h3>
                    </div>

                    <Command className="rounded-lg border shadow-md">
                      <CommandInput
                        placeholder="Search for your destination..."
                        className="text-base md:text-lg h-12"
                        autoFocus
                      />
                      <CommandList className="max-h-[400px]">
                        <CommandEmpty>No station found.</CommandEmpty>
                        <CommandGroup>
                          {stations
                            .filter((station) => station.value !== fromStation)
                            .map((station) => (
                              <CommandItem
                                key={station.value}
                                value={station.label}
                                onSelect={() => handleToSelect(station.value)}
                                className="cursor-pointer py-4 px-4 text-base md:text-lg aria-selected:bg-primary/10"
                              >
                                <Check
                                  className={cn(
                                    'mr-3 h-5 w-5 transition-all duration-200',
                                    toStation === station.value
                                      ? 'opacity-100 scale-100'
                                      : 'opacity-0 scale-75'
                                  )}
                                />
                                {station.label}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Results Section */}
      {showResults && (
        <div className="container mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <Button variant="ghost" onClick={handleReset} className="mb-4">
                ← Back to search
              </Button>
              <h2 className="text-3xl font-bold mb-2">
                Trains from {fromStationData?.label} to {toStationData?.label}
              </h2>
              <p className="text-muted-foreground">
                Showing available trains for your route
              </p>
            </div>

            {/* Mock Train Results */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <Train className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-lg">
                          Train #{i}23
                        </div>
                        <div className="text-sm text-gray-600">
                          Express Service
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {i + 5} min
                      </div>
                      <div className="text-sm text-gray-600">Arriving</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Departure</span>
                      <span className="font-medium">
                        {new Date(Date.now() + i * 300000).toLocaleTimeString(
                          [],
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-600">Estimated Arrival</span>
                      <span className="font-medium">
                        {new Date(
                          Date.now() + (i + 2) * 900000
                        ).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
