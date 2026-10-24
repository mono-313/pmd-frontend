"use client";
import type { SafeUserSession } from "@/app/types/auth";
const KEY = "pmd-user-session";
const EVENT = "pmd-session-change";
let pending: Promise<void> | null = null;
let exiting = false;
let installed = false;
let originalFetch: typeof fetch;
let retryAfter = 0;
export function readSession(): SafeUserSession | null {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "null");
    return value && typeof value.userName === "string" && Array.isArray(value.roles)
      && Array.isArray(value.networkIds) ? value : null;
  } catch { return null; }
}
function notify() { window.dispatchEvent(new Event(EVENT)); }
function invalidate() {
  localStorage.removeItem(KEY); localStorage.removeItem("userInfo"); notify();
  window.dispatchEvent(new Event("pmd-session-expired"));
}
export async function ensureSession(force = false): Promise<void> {
  if (exiting) return;
  if (pending) return pending;
  const before = localStorage.getItem(KEY);
  const session = readSession();
  if (!session) return;
  const expiry = Date.parse(session.expiresAt);
  if (!force && Number.isFinite(expiry) && expiry - Date.now() > 60000) return;
  if (Date.now() < retryAfter) throw new Error("تمدید نشست موقتاً در دسترس نیست؛ چند ثانیه دیگر تلاش کنید.");
  pending = (async () => {
    const response = await originalFetch("/api/auth/refresh", {
      method: "POST", credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(20000),
    });
    // Another tab logged out or changed account while this request was pending.
    if (exiting || localStorage.getItem(KEY) !== before) return;
    if (response.status === 401) { invalidate(); throw new Error("نشست پایان یافته است."); }
    if (!response.ok) throw new Error("تمدید نشست موقتاً انجام نشد.");
    const data = await response.json();
    if (typeof data.expiresAt !== "string" || !Number.isFinite(Date.parse(data.expiresAt)))
      throw new Error("پاسخ تمدید نشست معتبر نیست.");
    if (exiting || localStorage.getItem(KEY) !== before) return;
    const updated = { ...session, expiresAt: data.expiresAt };
    localStorage.setItem(KEY, JSON.stringify(updated));
    if (localStorage.getItem("userInfo")) localStorage.setItem("userInfo", JSON.stringify(updated));
    retryAfter = 0; notify();
  })().catch(error => { retryAfter = Date.now() + 10000; throw error; })
    .finally(() => { pending = null; });
  return pending;
}
// Central browser-fetch integration: same-origin /api/* only; auth and external requests bypass it.
export function installSessionFetch() {
  if (typeof window === "undefined" || installed) return;
  installed = true; originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input), window.location.href);
    if (url.origin !== window.location.origin || !url.pathname.startsWith("/api/")
      || ["/api/auth/login", "/api/auth/register", "/api/auth/refresh", "/api/auth/logout"].includes(url.pathname)
      || !readSession() || exiting)
      return originalFetch(input, init);
    const request = new Request(input, init);
    const retry = request.clone();
    await ensureSession();
    if (!readSession() || exiting) return new Response(JSON.stringify({ message: "نشست پایان یافته است." }),
      { status: 401, headers: { "Content-Type": "application/json" } });
    const response = await originalFetch(request);
    if (response.status !== 401 || request.signal.aborted) return response;
    await ensureSession(true);
    if (!readSession() || exiting) return response;
    // Exactly one retry after a successful refresh; 403 and server errors are not retried.
    return originalFetch(retry);
  };
}
export function startSessionMonitor(onChange: () => void, onExpired: () => void) {
  installSessionFetch(); exiting = false;
  const check = () => { if (document.visibilityState === "visible") void ensureSession().catch(() => {}); };
  const storage = (event: StorageEvent) => {
    if (event.key === KEY) { onChange(); if (!event.newValue) onExpired(); }
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener("pmd-session-expired", onExpired);
  window.addEventListener("storage", storage);
  window.addEventListener("focus", check);
  window.addEventListener("online", check);
  document.addEventListener("visibilitychange", check);
  const timer = window.setInterval(check, 15000);
  check();
  return () => {
    clearInterval(timer);
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("pmd-session-expired", onExpired);
    window.removeEventListener("storage", storage);
    window.removeEventListener("focus", check);
    window.removeEventListener("online", check);
    document.removeEventListener("visibilitychange", check);
  };
}
export async function logoutSession() {
  installSessionFetch(); exiting = true;
  try {
    // Wait for this tab's refresh so its Set-Cookie cannot undo logout.
    if (pending) await pending.catch(() => {});
    const response = await originalFetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    if (!response.ok) throw new Error("خروج انجام نشد.");
    localStorage.removeItem(KEY); localStorage.removeItem("userInfo"); notify();
  } finally { exiting = false; }
}
