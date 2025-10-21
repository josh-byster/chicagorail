import { Train, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStations } from '@/hooks/useStations';
import { useReachableStations } from '@/hooks/useReachableStations';
import { useTrains } from '@/hooks/useTrains';
import { useRouteSearchStore } from '@/stores/routeSearchStore';
import { useUrlSync } from '@/hooks/useUrlSync';
import { TrainList } from '@/components/TrainList/TrainList';
import { useNavigate } from 'react-router-dom';

export default function RoutePage() {
  const { origin, destination, hasSearched } = useRouteSearchStore();
  const navigate = useNavigate();

  // Sync URL parameters with search state (one-way: URL -> store)
  useUrlSync();

  // Fetch all stations for display
  const { data: allStations } = useStations();

  // Fetch reachable stations for destination
  const { data: reachableStations } = useReachableStations(origin || null);

  const {
    data: trains,
    isLoading,
    error,
  } = useTrains({
    origin,
    destination,
    enabled: hasSearched && !!origin && !!destination,
  });

  const fromStationData = allStations?.find((s) => s.station_id === origin);
  const toStationData = reachableStations?.find(
    (s) => s.station_id === destination
  );

  const handleChangeRoute = () => {
    // Navigate back to home
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50/30">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-2 font-semibold text-base text-gray-900">
            <Train className="h-5 w-5 text-blue-600" />
            Metra Tracker
          </div>
        </div>
      </nav>

      {/* Results Section */}
      <div className="container mx-auto px-4 py-12 animate-in fade-in duration-300">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                onClick={handleChangeRoute}
                className="mb-4 gap-2"
              >
                <span>Change route</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
              <h2 className="text-3xl font-bold">
                {fromStationData?.station_name} → {toStationData?.station_name}
              </h2>
            </div>
          </div>

          {/* Train Results */}
          <TrainList
            trains={trains}
            isLoading={isLoading}
            error={error}
            isEmpty={!isLoading && (!trains || trains.length === 0)}
          />
        </div>
      </div>
    </div>
  );
}
