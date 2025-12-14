import { Link, useLocation } from 'react-router-dom';
import { Train } from 'lucide-react';

export function Header() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Train className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Chicago Rail</h1>
          </Link>

          {!isHome && (
            <nav className="flex gap-6">
              <Link
                to="/departures"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === '/departures'
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                Departures
              </Link>
              <Link
                to="/arrivals"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === '/arrivals'
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                Arrivals
              </Link>
              <Link
                to="/trip-planner"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === '/trip-planner'
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                Trip Planner
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
