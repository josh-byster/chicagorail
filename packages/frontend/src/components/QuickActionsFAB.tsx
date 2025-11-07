import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Home,
  TrainTrack,
  Bell,
  BarChart3,
  Zap,
  X,
  Moon,
  Sun,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

/**
 * Floating Action Button (FAB) with quick actions for power users
 * Appears in bottom-right corner with expandable menu
 */
export function QuickActionsFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const actions: QuickAction[] = [
    {
      icon: <Home className="h-4 w-4" />,
      label: 'Home',
      onClick: () => {
        navigate('/');
        setIsOpen(false);
      },
    },
    {
      icon: <Search className="h-4 w-4" />,
      label: 'Search Trains',
      onClick: () => {
        if (location.pathname !== '/') {
          navigate('/');
        }
        setIsOpen(false);
        // Focus on search input after navigation
        setTimeout(() => {
          const searchInput = document.querySelector(
            '[cmdk-input]'
          ) as HTMLInputElement;
          searchInput?.focus();
        }, 100);
      },
    },
    {
      icon: <TrainTrack className="h-4 w-4" />,
      label: 'Lines',
      onClick: () => {
        navigate('/lines');
        setIsOpen(false);
      },
    },
    {
      icon: <Bell className="h-4 w-4" />,
      label: 'Alerts',
      onClick: () => {
        navigate('/alerts');
        setIsOpen(false);
      },
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      label: 'Stats',
      onClick: () => {
        navigate('/stats');
        setIsOpen(false);
      },
    },
    {
      icon: <Compass className="h-4 w-4" />,
      label: 'Nearby Stations',
      onClick: () => {
        if (location.pathname !== '/') {
          navigate('/');
        }
        setIsOpen(false);
        setTimeout(() => {
          const element = document.getElementById('nearby-stations');
          element?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
    },
    {
      icon:
        theme === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        ),
      label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
      onClick: () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
      },
      variant: 'outline' as const,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 transition-opacity animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Quick Actions Menu */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Action buttons - appear when open */}
        {isOpen && (
          <div className="flex flex-col gap-2 animate-fade-in-up">
            {actions.map((action, index) => (
              <Button
                key={action.label}
                onClick={action.onClick}
                variant={action.variant || 'default'}
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all animate-slide-in-right min-w-[180px] justify-start gap-3"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {action.icon}
                <span className="font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        )}

        {/* Main FAB button */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className={`rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all ${
            isOpen ? 'bg-destructive hover:bg-destructive/90 rotate-90' : ''
          }`}
          aria-label="Quick actions menu"
        >
          {isOpen ? (
            <X className="h-6 w-6 transition-transform" />
          ) : (
            <Zap className="h-6 w-6" />
          )}
        </Button>
      </div>
    </>
  );
}
