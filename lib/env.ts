import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  AURA_API_URL: z.string().url(),
  AURA_API_SECRET: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function resolveApiUrl(): string {
  const configured = process.env.AURA_API_URL?.trim();
  if (configured) {
    return configured;
  }
  if (process.env.NODE_ENV === "development") {
    return "http://127.0.0.1:8000";
  }
  throw new Error("AURA_API_URL is required outside development");
}

export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse({
    AURA_API_URL: resolveApiUrl(),
    AURA_API_SECRET: process.env.AURA_API_SECRET,
  });

  if (!parsed.success) {
    throw new Error(`Invalid server environment: ${parsed.error.message}`);
  }

  return parsed.data;
}
