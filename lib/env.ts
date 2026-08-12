import "server-only";

import { z } from "zod";

const DEV_FALLBACK_API_URL = "http://127.0.0.1:8000";
const DEFAULT_API_HOST_ALLOWLIST = ["aura-workspace-api.onrender.com"] as const;

const serverEnvSchema = z.object({
  AURA_API_URL: z.string().url(),
  AURA_API_SECRET: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

function apiHostAllowlist(): string[] {
  const raw = process.env.AURA_API_URL_ALLOWED_HOSTS?.trim();
  if (!raw) {
    return [...DEFAULT_API_HOST_ALLOWLIST];
  }
  return raw
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter((host) => host.length > 0);
}

function isLoopbackHostname(hostname: string): boolean {
  return hostname === "127.0.0.1" || hostname === "localhost";
}

/**
 * SSRF gate for the server-only engine URL.
 * Development: loopback only (default 127.0.0.1).
 * Any environment: https + host allowlist (Render hostname or AURA_API_URL_ALLOWED_HOSTS).
 */
function normalizeApiUrl(raw: string): string {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("AURA_API_URL is not a valid URL");
  }

  if (parsed.username || parsed.password) {
    throw new Error("AURA_API_URL must not include credentials");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("AURA_API_URL must be http or https");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (isLoopbackHostname(hostname)) {
    if (!isDevelopment()) {
      throw new Error("AURA_API_URL must not target loopback outside development");
    }
    return parsed.origin;
  }

  if (parsed.protocol !== "https:") {
    throw new Error("AURA_API_URL must use https for non-loopback hosts");
  }

  if (!apiHostAllowlist().includes(hostname)) {
    throw new Error("AURA_API_URL host is not in the SSRF allowlist");
  }

  return parsed.origin;
}

function resolveApiUrl(): string {
  const configured = process.env.AURA_API_URL?.trim();
  if (configured) {
    return normalizeApiUrl(configured);
  }
  if (isDevelopment()) {
    return DEV_FALLBACK_API_URL;
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
