import { z } from 'zod';

// Line Zod Schema (our clean model - transformed from routes)
export const LineSchema = z.object({
  line_id: z.string().min(1),
  line_name: z.string().min(1),
  line_short_name: z.string().min(1),
  line_color: z.string().regex(/^#[0-9A-F]{6}$/i), // Transformed: add # prefix
  line_text_color: z.string().regex(/^#[0-9A-F]{6}$/i), // Transformed: convert number to hex
  stations: z.array(z.string()).min(2), // Derived during import
  line_url: z.string().url().optional(),
  description: z.string().optional(),
});

// Line TypeScript Interface
export type Line = z.infer<typeof LineSchema>;
