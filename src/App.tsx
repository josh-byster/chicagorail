import { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, AppBar, Toolbar, Typography, CircularProgress } from '@mui/material';
import { theme } from './theme';
import { MetraService } from './services/metraService';
import RouteList from './components/RouteList';
import ScheduleView from './components/ScheduleView';
import { Route } from './types/metra';

function App() {
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const metraService = MetraService.getInstance();

  useEffect(() => {
    const loadData = async () => {
      try {
        await metraService.loadData();
        setLoading(false);
      } catch (error) {
        console.error('Failed to load Metra data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Metra Schedule Viewer
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
          <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ flex: { xs: '1', md: '0 0 300px' } }}>
              <RouteList
                onRouteSelect={setSelectedRoute}
                selectedRoute={selectedRoute}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              {selectedRoute ? (
                <ScheduleView route={selectedRoute} />
              ) : (
                <Typography variant="h6" color="text.secondary" align="center">
                  Select a route to view its schedule
                </Typography>
              )}
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
