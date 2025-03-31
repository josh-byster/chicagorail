import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { TripWithStops, StopTimeWithStop } from '../types/metra';
import { MetraService } from '../services/metraService';

interface ScheduleViewProps {
  selectedRoute: string;
  selectedDate: Date;
}

interface TrainRowProps {
  trip: TripWithStops;
}

const TrainRow: React.FC<TrainRowProps> = ({ trip }) => {
  const [open, setOpen] = useState(false);

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours);
    
    // Handle times past midnight (24:00+)
    if (hour >= 24) {
      hour = hour - 24;
    }
    
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const calculateDuration = (startTime: string, endTime: string): string => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    // Handle times past midnight
    let duration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    
    // Handle overnight trips
    if (duration < 0) {
      duration += 24 * 60;
    }

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  const firstStop = trip.stopTimes[0];
  const lastStop = trip.stopTimes[trip.stopTimes.length - 1];

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{formatTime(firstStop.departure_time)}</TableCell>
        <TableCell>
          {firstStop.stopName} → {lastStop.stopName}
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            ({trip.stopTimes.length} stops)
          </Typography>
        </TableCell>
      </TableRow>
      {open && (
        <TableRow>
          <TableCell colSpan={3}>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Stops
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Stop</TableCell>
                    <TableCell>Departure</TableCell>
                    <TableCell>Duration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trip.stopTimes.map((stop: StopTimeWithStop, index: number) => (
                    <TableRow key={stop.stop_id}>
                      <TableCell>{stop.stopName}</TableCell>
                      <TableCell>{formatTime(stop.departure_time)}</TableCell>
                      <TableCell>
                        {index > 0 ? calculateDuration(firstStop.departure_time, stop.departure_time) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export const ScheduleView: React.FC<ScheduleViewProps> = ({ selectedRoute, selectedDate }) => {
  const [trips, setTrips] = useState<TripWithStops[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const loadTrips = async () => {
      if (!selectedRoute) return;
      
      try {
        setLoading(true);
        setError(null);
        const metraService = MetraService.getInstance();
        metraService.setSelectedDate(selectedDate);
        const trips = await metraService.getTripsByRoute(selectedRoute);
        setTrips(trips);
      } catch (error) {
        console.error('Error loading trips:', error);
        setError('Failed to load trips');
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, [selectedRoute, selectedDate]);

  if (!selectedRoute) {
    return <Typography>Please select a route</Typography>;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  // Separate trips by direction
  const inboundTrips = trips.filter(trip => trip.direction_id === 1);
  const outboundTrips = trips.filter(trip => trip.direction_id === 0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label={`Outbound (${outboundTrips.length})`} />
        <Tab label={`Inbound (${inboundTrips.length})`} />
      </Tabs>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50}></TableCell>
              <TableCell>Departure</TableCell>
              <TableCell>Route</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(tabValue === 0 ? outboundTrips : inboundTrips).length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <Typography color="text.secondary">
                    No {tabValue === 0 ? 'outbound' : 'inbound'} trains scheduled for this date
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              (tabValue === 0 ? outboundTrips : inboundTrips).map((trip: TripWithStops) => (
                <TrainRow key={trip.trip_id} trip={trip} />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}; 