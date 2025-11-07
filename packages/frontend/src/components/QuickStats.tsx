import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Search, TrendingUp, Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getSavedRoutes, getRecentSearches } from '@/services/storage';
import { useAlerts } from '@/hooks/useAlerts';

export function QuickStats() {
  const navigate = useNavigate();

  const { data: savedRoutes, isLoading: savedLoading } = useQuery({
    queryKey: ['savedRoutes'],
    queryFn: getSavedRoutes,
  });

  const { data: recentSearches, isLoading: searchesLoading } = useQuery({
    queryKey: ['recentSearches'],
    queryFn: getRecentSearches,
  });

  const { data: alerts, isLoading: alertsLoading } = useAlerts({
    refetchInterval: 60000,
  });

  const isLoading = savedLoading || searchesLoading || alertsLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const activeAlerts =
    alerts?.filter((alert) => {
      if (alert.end_time) {
        return new Date(alert.end_time) > new Date();
      }
      return true;
    }) || [];

  // Calculate searches today
  const today = new Date().toDateString();
  const searchesToday =
    recentSearches?.filter(
      (search) => new Date(search.searched_at).toDateString() === today
    ).length || 0;

  const stats = [
    {
      icon: Bookmark,
      label: 'Saved Routes',
      value: savedRoutes?.length || 0,
      color: 'bg-blue-500',
      onClick: () => {
        if ((savedRoutes?.length || 0) > 0) {
          navigate('/');
          setTimeout(() => {
            document
              .getElementById('saved-routes')
              ?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      },
    },
    {
      icon: Search,
      label: 'Searches Today',
      value: searchesToday,
      color: 'bg-green-500',
      onClick: () => navigate('/'),
    },
    {
      icon: Bell,
      label: 'Active Alerts',
      value: activeAlerts.length,
      color: activeAlerts.length > 0 ? 'bg-orange-500' : 'bg-gray-400',
      onClick: () => navigate('/alerts'),
    },
    {
      icon: TrendingUp,
      label: 'Total Trips',
      value:
        savedRoutes?.reduce((sum, route) => sum + (route.use_count || 0), 0) ||
        0,
      color: 'bg-purple-500',
      onClick: () => navigate('/stats'),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105"
            onClick={stat.onClick}
          >
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div
                  className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center text-white`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-2xl">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stat.label}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
