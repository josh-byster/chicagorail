import { z } from 'zod';

// Station Zod Schema (our clean model)
export const StationSchema = z.object({
  station_id: z.string().min(1),
  station_name: z.string().min(1),
  station_code: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  lines_served: z.array(z.string()).min(1), // Derived during import
  zone: z.string().optional(),
  wheelchair_accessible: z.boolean(),
  platform_count: z.number().int().positive().optional(),
});

// Station TypeScript Interface
export type Station = z.infer<typeof StationSchema>;
