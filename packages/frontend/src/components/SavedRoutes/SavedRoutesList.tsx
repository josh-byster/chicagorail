import { SavedRoute } from '@metra/shared';
import { SavedRouteCard } from './SavedRouteCard';
import { useTrains } from '@/hooks/useTrains';
import { useStations } from '@/hooks/useStations';

/**
 * Wrapper component for individual saved routes.
 * This component exists to avoid Rules of Hooks violations by ensuring
 * hooks are called consistently (not conditionally based on array length).
 */
function SavedRouteCardWrapper({
  route,
  index,
  onRouteClick,
  onRouteDelete,
}: {
  route: SavedRoute;
  index: number;
  onRouteClick: (route: SavedRoute) => void;
  onRouteDelete: (route: SavedRoute) => void;
}) {
  // Fetch train data for this route
  const trainQuery = useTrains({
    origin: route.origin_station_id,
    destination: route.destination_station_id,
    limit: 1, // Only fetch the next train
  });

  // Fetch all stations to look up names
  const { data: stations = [] } = useStations();

  const nextTrain = trainQuery.data?.[0];
  const nextTrainTime = nextTrain ? nextTrain.departure_time : undefined;

  // Look up station names from IDs
  const originStation = stations.find(
    (s) => s.station_id === route.origin_station_id
  );
  const destinationStation = stations.find(
    (s) => s.station_id === route.destination_station_id
  );

  const originStationName =
    originStation?.station_name || route.origin_station_id;
  const destinationStationName =
    destinationStation?.station_name || route.destination_station_id;

  return (
    <div
      key={route.route_id}
      className={`animate-fade-in-up ${
        index > 0 ? `animate-delay-${Math.min(index * 100, 300)}` : ''
      }`}
    >
      <SavedRouteCard
        route={route}
        originStationName={originStationName}
        destinationStationName={destinationStationName}
        nextTrainTime={nextTrainTime}
        isLoading={trainQuery.isLoading}
        isError={!!trainQuery.error}
        onClick={() => onRouteClick(route)}
        onDelete={() => onRouteDelete(route)}
      />
    </div>
  );
}

export function SavedRoutesList({
  routes,
  onRouteClick,
  onRouteDelete,
}: {
  routes: SavedRoute[];
  onRouteClick: (route: SavedRoute) => void;
  onRouteDelete: (route: SavedRoute) => void;
}) {
  if (routes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 animate-fade-in animated">
      <h2 className="text-xl font-semibold animate-slide-in-left">
        Saved Routes
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map((route, index) => (
          <SavedRouteCardWrapper
            key={route.route_id}
            route={route}
            index={index}
            onRouteClick={onRouteClick}
            onRouteDelete={onRouteDelete}
          />
        ))}
      </div>
    </div>
  );
}
