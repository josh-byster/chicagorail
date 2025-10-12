import { z } from 'zod';

// SavedRoute Zod Schema (client-side only)
export const SavedRouteSchema = z.object({
  route_id: z.string().uuid(),
  origin_station_id: z.string().min(1),
  destination_station_id: z.string().min(1),
  label: z.string().min(1).max(50),
  created_at: z.string(),
  last_used_at: z.string(),
  use_count: z.number().int().min(0),
}).refine((data) => data.origin_station_id !== data.destination_station_id, {
  message: 'Origin and destination must be different',
});

// SavedRoute TypeScript Interface
export type SavedRoute = z.infer<typeof SavedRouteSchema>;
