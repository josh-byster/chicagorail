import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Collapse,
  IconButton,
  Chip,
  TextField,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Route, Trip, StopTime, Stop } from '../types/metra';
import { MetraService } from '../services/metraService';
import { format } from 'date-fns';

interface ScheduleViewProps {
  route: Route;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface TrainRowProps {
  trip: Trip;
  firstStop: StopTime & { stopName: string };
  lastStop: StopTime & { stopName: string };
  stopTimes: Array<StopTime & { stopName: string }>;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`schedule-tabpanel-${index}`}
      aria-labelledby={`schedule-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TrainRow = ({ trip, firstStop, lastStop, stopTimes }: TrainRowProps) => {
  const [open, setOpen] = useState(false);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const calculateDuration = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const [startHours, startMinutes] = firstStop.departure_time.split(':').map(Number);
    
    let totalMinutes = (hours - startHours) * 60 + (minutes - startMinutes);
    
    // Handle case where time crosses midnight
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }
    
    return `${totalMinutes}m`;
  };

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            size="small"
            onClick={() => setOpen(!open)}
            sx={{ transform: open ? 'rotate(180deg)' : 'none' }}
          >
            <KeyboardArrowDownIcon />
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1">
              {formatTime(firstStop.departure_time)}
            </Typography>
            <Chip 
              label={`${stopTimes.length} stops`}
              size="small"
              variant="outlined"
            />
          </Box>
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {firstStop.stopName} → {lastStop.stopName}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                All Stops
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Stop</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stopTimes.map((stopTime, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatTime(stopTime.departure_time)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {calculateDuration(stopTime.departure_time)}
                        </Typography>
                      </TableCell>
                      <TableCell>{stopTime.stopName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const ScheduleView = ({ route }: ScheduleViewProps) => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const metraService = MetraService.getInstance();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    setSelectedDate(newDate);
    setLoading(true);
    metraService.setSelectedDate(newDate);
    // Use setTimeout to ensure the UI updates before the data is processed
    setTimeout(() => setLoading(false), 0);
  };

  const trips = useMemo(() => {
    return metraService.getTripsByRoute(route.route_id);
  }, [route.route_id, selectedDate]);

  const renderScheduleTable = (directionId: number) => {
    const directionTrips = trips
      .filter(trip => trip.direction_id === directionId)
      .sort((a, b) => {
        return a.stopTimes[0].departure_time.localeCompare(b.stopTimes[0].departure_time);
      });

    if (directionTrips.length === 0) {
      return (
        <Typography variant="body1" color="text.secondary" align="center">
          No trains scheduled for this direction on {format(selectedDate, 'MMMM d, yyyy')}
        </Typography>
      );
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50} />
              <TableCell>Departure</TableCell>
              <TableCell>Route</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {directionTrips.map(trip => (
              <TrainRow
                key={trip.trip_id}
                trip={trip}
                firstStop={trip.stopTimes[0]}
                lastStop={trip.stopTimes[trip.stopTimes.length - 1]}
                stopTimes={trip.stopTimes}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ color: `#${route.route_color}` }}>
            {route.route_long_name} Schedule
          </Typography>
          <TextField
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={handleDateChange}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 200 }}
          />
        </Box>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Outbound" />
            <Tab label="Inbound" />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderScheduleTable(0)
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderScheduleTable(1)
          )}
        </TabPanel>
      </CardContent>
    </Card>
  );
};

export default ScheduleView; 