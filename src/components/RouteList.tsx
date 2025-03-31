import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Route } from '../types/metra';
import { MetraService } from '../services/metraService';

interface RouteListProps {
  onRouteSelect: (route: Route) => void;
  selectedRoute: Route | null;
}

const RouteList = ({ onRouteSelect, selectedRoute }: RouteListProps) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setLoading(true);
        setError(null);
        const metraService = MetraService.getInstance();
        const routes = await metraService.getRoutes();
        setRoutes(routes);
      } catch (error) {
        console.error('Error loading routes:', error);
        setError('Failed to load routes');
      } finally {
        setLoading(false);
      }
    };

    loadRoutes();
  }, []);

  const filteredRoutes = routes.filter(route =>
    route.route_long_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.route_short_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="card">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Metra Routes</h2>
      
      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search routes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input"
        />
      </div>

      {/* Routes List */}
      <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
        <AnimatePresence>
          {filteredRoutes.map((route) => (
            <motion.div
              key={route.route_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => onRouteSelect(route)}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  selectedRoute?.route_id === route.route_id
                    ? 'bg-primary-50 border-l-4 border-primary-600'
                    : 'hover:bg-gray-50 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 
                      className={`font-medium ${
                        selectedRoute?.route_id === route.route_id
                          ? 'text-primary-900'
                          : 'text-gray-900'
                      }`}
                    >
                      {route.route_long_name}
                    </h3>
                    <p className="text-sm text-gray-500">{route.route_short_name}</p>
                  </div>
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: `#${route.route_color}` }}
                  />
                </div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RouteList; 