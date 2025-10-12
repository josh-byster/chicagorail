import { z } from 'zod';

// AlertType Enum
export enum AlertType {
  DELAY = 'delay',
  CANCELLATION = 'cancellation',
  DETOUR = 'detour',
  SCHEDULE_CHANGE = 'schedule_change',
  CONSTRUCTION = 'construction',
  WEATHER = 'weather',
  INCIDENT = 'incident',
  INFORMATION = 'information',
}

// AlertSeverity Enum
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  SEVERE = 'severe',
}

// ServiceAlert Zod Schema
export const ServiceAlertSchema = z.object({
  alert_id: z.string().min(1),
  affected_lines: z.array(z.string()).optional(),
  affected_stations: z.array(z.string()).optional(),
  affected_trips: z.array(z.string()).optional(),
  alert_type: z.nativeEnum(AlertType),
  severity: z.nativeEnum(AlertSeverity),
  header: z.string().min(1).max(100),
  description: z.string().min(1),
  start_time: z.string(),
  end_time: z.string().optional(),
  url: z.string().url().optional(),
});

// ServiceAlert TypeScript Interface
export type ServiceAlert = z.infer<typeof ServiceAlertSchema>;
