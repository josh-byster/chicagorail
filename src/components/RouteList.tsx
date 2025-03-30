import { Card, CardContent, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';
import { Route } from '../types/metra';
import { MetraService } from '../services/metraService';

interface RouteListProps {
  onRouteSelect: (route: Route) => void;
  selectedRoute: Route | null;
}

const RouteList = ({ onRouteSelect, selectedRoute }: RouteListProps) => {
  const metraService = MetraService.getInstance();
  const routes = metraService.getRoutes();

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