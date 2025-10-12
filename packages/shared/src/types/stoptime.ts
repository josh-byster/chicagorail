import { z } from 'zod';

// StopTime Zod Schema
export const StopTimeSchema = z.object({
  trip_id: z.string().min(1),
  station_id: z.string().min(1),
  station_name: z.string().optional(),
  arrival_time: z.string(),
  departure_time: z.string(),
  stop_sequence: z.number().int().positive(),
  actual_arrival: z.string().optional(),
  actual_departure: z.string().optional(),
  delay_minutes: z.number(),
  headsign: z.string().optional(),
  platform: z.string().optional(),
  pickup_type: z.number().int().min(0).max(3),
  drop_off_type: z.number().int().min(0).max(3),
});

// StopTime TypeScript Interface
export type StopTime = z.infer<typeof StopTimeSchema>;
