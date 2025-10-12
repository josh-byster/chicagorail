import { z } from 'zod';

// TrainStatus Enum
export enum TrainStatus {
  SCHEDULED = 'scheduled',
  ON_TIME = 'on_time',
  DELAYED = 'delayed',
  EARLY = 'early',
  APPROACHING = 'approaching',
  DEPARTED = 'departed',
  ARRIVED = 'arrived',
  CANCELLED = 'cancelled',
}

// Position Schema and Interface
export const PositionSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  bearing: z.number().min(0).max(359).optional(),
  speed: z.number().optional(),
});

export type Position = z.infer<typeof PositionSchema>;

// Train Zod Schema (combines static trip data + realtime updates)
export const TrainSchema = z.object({
  trip_id: z.string().min(1),
  train_number: z.string().optional(),
  line_id: z.string().min(1),
  line_name: z.string(),
  line_color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(), // Hex color with # prefix
  line_text_color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(), // Hex color with # prefix
  origin_station_id: z.string().min(1),
  destination_station_id: z.string().min(1),
  departure_time: z.string(),
  arrival_time: z.string(),
  status: z.nativeEnum(TrainStatus),
  delay_minutes: z.number(),
  current_station_id: z.string().optional(),
  current_position: PositionSchema.optional(),
  platform: z.string().optional(),
  stops: z.array(z.any()), // Will be StopTime[] - using z.any() to avoid circular dependency
  service_id: z.string().optional(),
  updated_at: z.string(),
});

// Train TypeScript Interface
export type Train = z.infer<typeof TrainSchema>;
