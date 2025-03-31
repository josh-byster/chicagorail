import { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, AppBar, Toolbar, Typography, TextField } from '@mui/material';
import { theme } from './theme';
import { MetraService } from './services/metraService';
import RouteList from './components/RouteList';
import { ScheduleView } from './components/ScheduleView';
import { Route } from './types/metra';
import { format } from 'date-fns';

function App() {
  // Get today's date in YYYY-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const metraService = MetraService.getInstance();

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Metra Schedule
            </Typography>
            <TextField
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              InputLabelProps={{ shrink: true }}
              sx={{ color: 'white' }}
            />
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
          <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ flex: { xs: '1', md: '0 0 300px' } }}>
              <RouteList
                onRouteSelect={handleRouteSelect}
                selectedRoute={selectedRoute}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              {selectedRoute && (
                <ScheduleView
                  selectedRoute={selectedRoute.route_id}
                  selectedDate={new Date(selectedDate)}
                />
              )}
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
