// Owner/admin mode. The password is checked on the SERVER (api/config.js, variable ADMIN_PASSWORD), which hands back a
// signed token that expires after 8 hours. The token lives in sessionStorage, so closing the tab logs out.
// Being "admin" in the browser only reveals owner tools and lets the owner call the save API; the API itself
// re-checks the token, so nobody else can change the site's settings. See docs/ADMIN.md.
//
// Ways in: the keyboard shortcut Alt+Shift+A (see layouts/Main.tsx) or tapping the logo 7 times (phones).

import { useSyncExternalStore } from "react";

const TOKEN_KEY = "memcard_admin_token";

interface StoredToken {
  token: string;
  expiresAt: number;
}

function readToken(now = Date.now()): StoredToken | null {
  try {
    const t = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || "null") as StoredToken | null;
    if (t && typeof t.token === "string" && typeof t.expiresAt === "number" && t.expiresAt > now) return t;
  } catch {}
  return null;
}

export const isAdmin = (): boolean => readToken() !== null;
export const getAdminToken = (): string | null => readToken()?.token ?? null;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const useAdmin = (): boolean => useSyncExternalStore(subscribe, isAdmin);

export type LoginResult = "ok" | "wrong" | "locked" | "not_configured" | "unavailable";

/** Sends the password to the server. Nothing about it is stored; only the signed token that comes back. */
export async function adminLogin(password: string): Promise<LoginResult> {
  let res: Response;
  try {
    res = await fetch("/api/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
  } catch {
    return "unavailable";
  }
  if (res.status === 401) return "wrong";
  if (res.status === 429) return "locked";
  if (res.status === 503) return "not_configured";
  const body = res.ok && (res.headers.get("content-type") || "").includes("json") ? await res.json().catch(() => null) : null;
  if (!body || typeof body.token !== "string") return "unavailable"; // no /api here (for example `npm start`)
  try {
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ token: body.token, expiresAt: Number(body.expiresAt) || Date.now() + 60 * 60 * 1000 }));
  } catch {}
  notify();
  return "ok";
}

export function lockAdmin() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {}
  notify();
}

/** Opens the admin console from anywhere (Main renders it). */
export const OPEN_ADMIN_EVENT = "memcard-open-admin";
export const openAdminConsole = (tab?: "donate" | "apps" | "system") => window.dispatchEvent(new CustomEvent(OPEN_ADMIN_EVENT, { detail: { tab } }));

/**
 * The text to show for an error: everyone gets the plain message; admins also get the technical detail
 * (which API to enable, which origin to add...) that would only confuse or expose setup to ordinary users.
 */
export function viewerMessage(err: unknown, fallback = "Đã xảy ra lỗi."): string {
  const e = err as { message?: string; detail?: string } | null;
  const base = e?.message || fallback;
  return isAdmin() && e?.detail ? `${base} [Admin] ${e.detail}` : base;
}
