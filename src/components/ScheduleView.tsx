import { useState } from 'react';
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
        <TableCell align="right">
          <Typography variant="subtitle1">
            {formatTime(lastStop.arrival_time)}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                All Stops
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Departure</TableCell>
                    <TableCell>Arrival</TableCell>
                    <TableCell>Stop</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stopTimes.map((stopTime, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatTime(stopTime.departure_time)}</TableCell>
                      <TableCell>{formatTime(stopTime.arrival_time)}</TableCell>
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
  const metraService = MetraService.getInstance();
  const trips = metraService.getTripsByRoute(route.route_id);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStopTimesForTrip = (tripId: string) => {
    const stopTimes = metraService.getStopTimesByTrip(tripId);
    return stopTimes.map(stopTime => {
      const stop = metraService.getStopById(stopTime.stop_id);
      return {
        ...stopTime,
        stopName: stop?.stop_name || 'Unknown Stop',
      };
    });
  };

  const renderScheduleTable = (directionId: number) => {
    const directionTrips = trips
      .filter(trip => trip.direction_id === directionId)
      .sort((a, b) => {
        const aTimes = getStopTimesForTrip(a.trip_id);
        const bTimes = getStopTimesForTrip(b.trip_id);
        return aTimes[0].departure_time.localeCompare(bTimes[0].departure_time);
      });

    if (directionTrips.length === 0) {
      return (
        <Typography variant="body1" color="text.secondary" align="center">
          No trains scheduled for this direction today
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
              <TableCell align="right">Arrival</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {directionTrips.map(trip => {
              const stopTimes = getStopTimesForTrip(trip.trip_id);
              return (
                <TrainRow
                  key={trip.trip_id}
                  trip={trip}
                  firstStop={stopTimes[0]}
                  lastStop={stopTimes[stopTimes.length - 1]}
                  stopTimes={stopTimes}
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ color: `#${route.route_color}` }}>
          {route.route_long_name} Schedule
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Outbound" />
            <Tab label="Inbound" />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          {renderScheduleTable(0)}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {renderScheduleTable(1)}
        </TabPanel>
      </CardContent>
    </Card>
  );
};

export default ScheduleView; 