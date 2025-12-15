import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-3 md:py-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 md:gap-2 hover:opacity-80 transition-opacity">
            <img src="/icon.png" alt="Chicago Rail" className="h-6 w-6 md:h-8 md:w-8 rounded-lg" />
            <h1 className="text-lg md:text-2xl font-bold">Chicago Rail</h1>
          </Link>

          {!isHome && (
            <nav className="flex gap-3 md:gap-6">
              <Link
                to="/departures"
                className={`text-xs md:text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === '/departures'
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                Departures
              </Link>
              <Link
                to="/trip-planner"
                className={`text-xs md:text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === '/trip-planner'
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                Plan a Trip
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
