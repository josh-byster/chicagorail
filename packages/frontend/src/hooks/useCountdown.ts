import { useState, useEffect } from 'react';
import { differenceInSeconds, differenceInMinutes } from 'date-fns';

export interface CountdownResult {
  /** Total seconds remaining */
  totalSeconds: number;
  /** Human-readable countdown string (e.g., "5m", "2h 30m", "45s") */
  formatted: string;
  /** Whether the countdown has expired */
  isExpired: boolean;
  /** Whether departure is imminent (< 2 minutes) */
  isImminent: boolean;
  /** Raw time components */
  components: {
    hours: number;
    minutes: number;
    seconds: number;
  };
}

/**
 * Hook that provides a live countdown to a target time
 * Updates every second for accurate real-time display
 */
export function useCountdown(
  targetTime: string | Date | null
): CountdownResult | null {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Update every second
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!targetTime) {
    return null;
  }

  const target =
    typeof targetTime === 'string' ? new Date(targetTime) : targetTime;
  const totalSeconds = differenceInSeconds(target, now);

  if (totalSeconds <= 0) {
    return {
      totalSeconds: 0,
      formatted: 'Departed',
      isExpired: true,
      isImminent: false,
      components: { hours: 0, minutes: 0, seconds: 0 },
    };
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let formatted: string;
  if (hours > 0) {
    formatted = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else if (minutes > 0) {
    formatted = `${minutes}m`;
  } else {
    formatted = `${seconds}s`;
  }

  return {
    totalSeconds,
    formatted,
    isExpired: false,
    isImminent: totalSeconds < 120, // Less than 2 minutes
    components: { hours, minutes, seconds },
  };
}

/**
 * Calculate trip duration between two times
 */
export function calculateTripDuration(
  departureTime: string | Date,
  arrivalTime: string | Date
): {
  minutes: number;
  formatted: string;
} {
  const departure =
    typeof departureTime === 'string' ? new Date(departureTime) : departureTime;
  const arrival =
    typeof arrivalTime === 'string' ? new Date(arrivalTime) : arrivalTime;

  const totalMinutes = differenceInMinutes(arrival, departure);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let formatted: string;
  if (hours > 0) {
    formatted = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else {
    formatted = `${minutes}m`;
  }

  return {
    minutes: totalMinutes,
    formatted,
  };
}
