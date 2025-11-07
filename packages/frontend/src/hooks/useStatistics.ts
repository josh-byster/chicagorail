import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSavedRoutes } from '../services/storage';
import { useStations } from './useStations';
import { useLines } from './useLines';
import { differenceInDays, parseISO, startOfDay, format } from 'date-fns';

export function useStatistics() {
  const { data: savedRoutes, isLoading: routesLoading } = useQuery({
    queryKey: ['savedRoutes'],
    queryFn: getSavedRoutes,
  });

  const { data: stations } = useStations();
  const { data: lines } = useLines();

  const statistics = useMemo(() => {
    if (!savedRoutes || savedRoutes.length === 0) {
      return null;
    }

    // Total trips
    const totalTrips = savedRoutes.reduce(
      (sum, route) => sum + route.use_count,
      0
    );

    // Most used route
    const mostUsedRoute = savedRoutes.reduce((prev, current) =>
      prev.use_count > current.use_count ? prev : current
    );

    // Most popular stations
    const stationUsage = new Map<string, number>();
    savedRoutes.forEach((route) => {
      stationUsage.set(
        route.origin_station_id,
        (stationUsage.get(route.origin_station_id) || 0) + route.use_count
      );
      stationUsage.set(
        route.destination_station_id,
        (stationUsage.get(route.destination_station_id) || 0) + route.use_count
      );
    });

    const sortedStations = Array.from(stationUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topStations = sortedStations.map(([stationId, count]) => ({
      station: stations?.find((s) => s.station_id === stationId),
      count,
    }));

    // Most used lines (from stations)
    const lineUsage = new Map<string, number>();
    savedRoutes.forEach((route) => {
      const originStation = stations?.find(
        (s) => s.station_id === route.origin_station_id
      );
      const destStation = stations?.find(
        (s) => s.station_id === route.destination_station_id
      );

      // Count lines that serve both stations
      const commonLines = originStation?.lines_served?.filter((lineId) =>
        destStation?.lines_served?.includes(lineId)
      );

      commonLines?.forEach((lineId) => {
        lineUsage.set(lineId, (lineUsage.get(lineId) || 0) + route.use_count);
      });
    });

    const sortedLines = Array.from(lineUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topLines = sortedLines.map(([lineId, count]) => ({
      line: lines?.find((l) => l.line_id === lineId),
      count,
    }));

    // Days since first route
    const oldestRoute = savedRoutes.reduce((prev, current) =>
      new Date(prev.created_at) < new Date(current.created_at) ? prev : current
    );
    const daysSinceFirst = differenceInDays(
      new Date(),
      parseISO(oldestRoute.created_at)
    );

    // Recent activity (last 7 days)
    const sevenDaysAgo = startOfDay(new Date());
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRoutes = savedRoutes.filter(
      (route) => new Date(route.last_used_at) >= sevenDaysAgo
    );

    // Activity by day of week
    const dayOfWeekUsage = new Map<string, number>();
    savedRoutes.forEach((route) => {
      const day = format(parseISO(route.last_used_at), 'EEEE');
      dayOfWeekUsage.set(day, (dayOfWeekUsage.get(day) || 0) + route.use_count);
    });

    const activityByDay = Array.from(dayOfWeekUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([day, count]) => ({ day, count }));

    return {
      totalRoutes: savedRoutes.length,
      totalTrips,
      mostUsedRoute: {
        ...mostUsedRoute,
        originStation: stations?.find(
          (s) => s.station_id === mostUsedRoute.origin_station_id
        ),
        destinationStation: stations?.find(
          (s) => s.station_id === mostUsedRoute.destination_station_id
        ),
      },
      topStations,
      topLines,
      daysSinceFirst,
      recentActivity: recentRoutes.length,
      activityByDay,
    };
  }, [savedRoutes, stations, lines]);

  return {
    statistics,
    isLoading: routesLoading,
  };
}
