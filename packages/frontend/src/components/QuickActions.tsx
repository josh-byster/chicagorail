import {
  Bell,
  Train,
  TrendingUp,
  Navigation as NavigationIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSavedRoutes } from '../services/storage';
import { useAlerts } from '../hooks/useAlerts';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

export function QuickActions() {
  const navigate = useNavigate();
  const { data: savedRoutes } = useQuery({
    queryKey: ['savedRoutes'],
    queryFn: getSavedRoutes,
  });

  const { data: alerts } = useAlerts({ refetchInterval: 60000 });

  const activeAlerts = alerts?.filter((alert) => {
    if (alert.end_time) {
      return new Date(alert.end_time) > new Date();
    }
    return true;
  });

  const hasStats = savedRoutes && savedRoutes.length > 0;

  const actions = [
    {
      icon: Train,
      label: 'Browse Lines',
      description: 'Explore all Metra lines',
      onClick: () => navigate('/lines'),
      color: 'bg-blue-500',
    },
    {
      icon: Bell,
      label: 'Service Alerts',
      description: activeAlerts?.length
        ? `${activeAlerts.length} active alerts`
        : 'No alerts',
      onClick: () => navigate('/alerts'),
      color: 'bg-orange-500',
      badge: activeAlerts?.length || 0,
    },
    {
      icon: NavigationIcon,
      label: 'Nearby Stations',
      description: 'Find stations near you',
      onClick: () => {
        // Scroll to nearby stations component
        const element = document.getElementById('nearby-stations');
        element?.scrollIntoView({ behavior: 'smooth' });
      },
      color: 'bg-green-500',
    },
    ...(hasStats
      ? [
          {
            icon: TrendingUp,
            label: 'Your Statistics',
            description: `${savedRoutes.length} saved routes`,
            onClick: () => navigate('/statistics'),
            color: 'bg-purple-500',
          },
        ]
      : []),
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Card
            key={action.label}
            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 relative"
            onClick={action.onClick}
          >
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div
                  className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center text-white relative`}
                >
                  <Icon className="h-6 w-6" />
                  {action.badge !== undefined && action.badge > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {action.description}
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
