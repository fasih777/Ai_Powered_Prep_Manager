import 'server-only';
import { z } from 'zod';

const serverEnvSchema = z.object({
  PYTHON_API_URL: z.string().url().default('http://localhost:8000'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  BACKEND_URL: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let _serverEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (!_serverEnv) {
    const raw = {
      PYTHON_API_URL: process.env.PYTHON_API_URL ?? 'http://localhost:8000',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      BACKEND_URL: process.env.BACKEND_URL,
    };
    const parsed = serverEnvSchema.safeParse(raw);
    if (!parsed.success) {
      console.warn('Server environment validation warning:', parsed.error.format());
      _serverEnv = {
        PYTHON_API_URL: process.env.PYTHON_API_URL ?? 'http://localhost:8000',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        BACKEND_URL: process.env.BACKEND_URL,
      };
    } else {
      _serverEnv = parsed.data;
    }
  }
  return _serverEnv;
}
