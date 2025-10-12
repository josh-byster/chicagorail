import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_PATH: z.string().default('./data/gtfs.db'),
  METRA_API_USERNAME: z.string(),
  METRA_API_PASSWORD: z.string(),
  GTFS_STATIC_BASE_URL: z.string().url(),
  GTFS_REALTIME_ALERTS_URL: z.string().url(),
  GTFS_REALTIME_TRIP_UPDATES_URL: z.string().url(),
  GTFS_REALTIME_POSITIONS_URL: z.string().url(),
  CORS_ORIGIN: z.string().optional(),
});

let cachedEnv: z.infer<typeof envSchema> | null = null;

const parseEnv = () => {
  if (cachedEnv) {
    return cachedEnv;
  }

  try {
    cachedEnv = envSchema.parse(process.env);
    return cachedEnv;
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    console.error(error);
    process.exit(1);
  }
};

// Lazy evaluation - only parse when accessed
export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(_target, prop) {
    const parsed = parseEnv();
    return parsed[prop as keyof typeof parsed];
  },
});
