import { Home, Bell, Train, TrendingUp } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAlerts } from '../hooks/useAlerts';

export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: alerts } = useAlerts({ refetchInterval: 60000 });

  const activeAlerts = alerts?.filter((alert) => {
    if (alert.end_time) {
      return new Date(alert.end_time) > new Date();
    }
    return true;
  });

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/lines', icon: Train, label: 'Lines' },
    {
      path: '/alerts',
      icon: Bell,
      label: 'Alerts',
      badge: activeAlerts?.length || 0,
    },
    { path: '/statistics', icon: TrendingUp, label: 'Stats' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Train className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl hidden sm:inline">
              Metra Tracker
            </span>
          </div>

          {/* Nav Items */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Button
                  key={item.path}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className="relative"
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
