import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional().or(z.literal('')),
  NEXT_PUBLIC_APP_ENV: z.enum(['local', 'staging', 'production']).default('local'),
  NEXT_PUBLIC_ENABLE_LAB: z.string().default('false').transform((v) => v === 'true'),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

let _clientEnv: ClientEnv | null = null;

export function getClientEnv(): ClientEnv {
  if (!_clientEnv) {
    const raw = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV ?? 'local',
      NEXT_PUBLIC_ENABLE_LAB: process.env.NEXT_PUBLIC_ENABLE_LAB ?? 'false',
    };
    const parsed = clientEnvSchema.safeParse(raw);
    if (!parsed.success) {
      console.warn('Client environment validation warning:', parsed.error.format());
      _clientEnv = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        NEXT_PUBLIC_APP_ENV: (process.env.NEXT_PUBLIC_APP_ENV as any) ?? 'local',
        NEXT_PUBLIC_ENABLE_LAB: process.env.NEXT_PUBLIC_ENABLE_LAB === 'true',
      };
    } else {
      _clientEnv = parsed.data;
    }
  }
  return _clientEnv;
}
