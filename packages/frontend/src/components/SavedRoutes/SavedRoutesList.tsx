import { SavedRoute } from "@metra/shared"
import { SavedRouteCard } from "./SavedRouteCard"
import { useTrains } from "@/hooks/useTrains"

export function SavedRoutesList({
  routes,
  onRouteClick,
  onRouteDelete,
}: {
  routes: SavedRoute[]
  onRouteClick: (route: SavedRoute) => void
  onRouteDelete: (route: SavedRoute) => void
}) {
  if (routes.length === 0) {
    return null
  }

  // Fetch train data for each saved route
  const trainQueries = routes.map(route => 
    useTrains({
      origin: route.origin_station_id,
      destination: route.destination_station_id,
      limit: 1, // Only fetch the next train
    })
  )

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Saved Routes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map((route, index) => {
          const trainQuery = trainQueries[index]
          const nextTrain = trainQuery.data?.[0]
          const nextTrainTime = nextTrain ? nextTrain.departure_time : undefined

          return (
            <SavedRouteCard
              key={route.route_id}
              route={route}
              originStationName={route.origin_station_id}
              destinationStationName={route.destination_station_id}
              nextTrainTime={nextTrainTime}
              isLoading={trainQuery.isLoading}
              isError={!!trainQuery.error}
              onClick={() => onRouteClick(route)}
              onDelete={() => onRouteDelete(route)}
            />
          )
        })}
      </div>
    </div>
  )
}
