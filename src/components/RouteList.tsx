import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  CircularProgress,
  Box
} from '@mui/material';
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

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Metra Routes
        </Typography>
        <List>
          {routes.map((route) => (
            <ListItem key={route.route_id} disablePadding>
              <ListItemButton
                selected={selectedRoute?.route_id === route.route_id}
                onClick={() => onRouteSelect(route)}
                sx={{
                  borderLeft: 4,
                  borderColor: `#${route.route_color}`,
                  '&.Mui-selected': {
                    backgroundColor: `#${route.route_color}20`,
                  },
                }}
              >
                <ListItemText
                  primary={route.route_long_name}
                  secondary={route.route_short_name}
                  primaryTypographyProps={{
                    style: { color: `#${route.route_color}` },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default RouteList; 