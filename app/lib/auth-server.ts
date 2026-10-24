import "server-only";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { API_CONFIG } from "@/app/lib/api-config";

type Tokens = { accessToken: string; refreshToken: string; expiresAt: string };
export class AuthFailure extends Error {
  constructor(public status: number, message: string) { super(message); }
}
// Browser retention policy; this does NOT extend the backend token lifetime.
const RETENTION = 7 * 24 * 60 * 60;
const secure = process.env.AUTH_COOKIE_SECURE === "false" ? false
  : process.env.AUTH_COOKIE_SECURE === "true" ? true
  : process.env.NODE_ENV === "production";
const options = { httpOnly: true, secure, sameSite: "lax" as const, path: "/" };
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.AUTH_APP_ORIGIN || new URL(request.url).origin;
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== expected))
    throw new AuthFailure(403, "مبدأ درخواست معتبر نیست.");
}
export function normalizeTokens(value: unknown): Tokens {
  if (!value || typeof value !== "object") throw new AuthFailure(502, "پاسخ توکن معتبر نیست.");
  const data = value as Record<string, unknown>;
  if (typeof data.accessToken !== "string" || !data.accessToken ||
      typeof data.refreshToken !== "string" || !data.refreshToken)
    throw new AuthFailure(502, "وب‌سرویس هر دو توکن را برنگرداند.");
  let expiration = typeof data.expiresAt === "string" ? Date.parse(data.expiresAt) : NaN;
  // Refresh documentation may return only tokens. Use exp ONLY as scheduling metadata.
  if (!Number.isFinite(expiration)) {
    try {
      const payload = JSON.parse(Buffer.from(data.accessToken.split(".")[1], "base64url").toString());
      expiration = typeof payload.exp === "number" ? payload.exp * 1000 : NaN;
    } catch { /* checked below */ }
  }
  if (!Number.isFinite(expiration) || expiration <= Date.now())
    throw new AuthFailure(502, "زمان انقضای توکن وب‌سرویس معتبر نیست؛ ساعت سرور را هم بررسی کنید.");
  return { accessToken: data.accessToken, refreshToken: data.refreshToken,
    expiresAt: new Date(expiration).toISOString() };
}
export async function saveTokens(tokens: Tokens) {
  const jar = await cookies();
  // Retain the old access token after JWT expiry: backend refresh requires it.
  jar.set("access-token", tokens.accessToken, { ...options, maxAge: RETENTION });
  jar.set("refresh-token", tokens.refreshToken, {
    ...options, sameSite: "strict", path: "/api/auth", maxAge: RETENTION,
  });
}
export async function clearTokens() {
  const jar = await cookies();
  jar.set("access-token", "", { ...options, maxAge: 0 });
  jar.set("refresh-token", "", { ...options, sameSite: "strict", path: "/api/auth", maxAge: 0 });
}
export async function backendAuth(endpoint: string, body: unknown, accessToken?: string) {
  const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(15000),
    headers: { "Content-Type": "application/json", Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    body: JSON.stringify(body),
  });
  return response;
}
// Single Node process deployment. Multiple replicas require a shared atomic lock/cache.
const shared = globalThis as typeof globalThis & {
  pmdRefreshJobs?: Map<string, { until: number; job: Promise<Tokens> }>;
};
const jobs = shared.pmdRefreshJobs ??= new Map();
export async function rotateTokens(accessToken: string, refreshToken: string): Promise<Tokens> {
  const key = createHash("sha256").update(accessToken).update("\0").update(refreshToken).digest("hex");
  const now = Date.now();
  for (const [k, v] of jobs) if (v.until < now) jobs.delete(k);
  const existing = jobs.get(key);
  if (existing) return existing.job;
  const job = (async () => {
    const response = await backendAuth(API_CONFIG.endpoints.refresh, { accessToken, refreshToken });
    if (response.status === 401) throw new AuthFailure(401, "نشست پایان یافته است؛ دوباره وارد شوید.");
    if (!response.ok) throw new AuthFailure(503, "تمدید نشست موقتاً انجام نشد؛ دوباره تلاش کنید.");
    return normalizeTokens(await response.json());
  })();
  const entry = { until: now + 30000, job };
  jobs.set(key, entry);
  try { return await job; }
  catch (error) { if (jobs.get(key) === entry) jobs.delete(key); throw error; }
  finally { setTimeout(() => { if (jobs.get(key) === entry) jobs.delete(key); }, 30000).unref(); }
}
