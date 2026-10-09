// Site-wide settings the owner edits from the admin console (donation account, "related apps" list).
// They live in Vercel Edge Config behind /api/config (see api/_lib.js and docs/ADMIN.md), so every visitor gets them.
// The last answer is cached in localStorage, so the app renders instantly and still works offline or without the API.

import { useSyncExternalStore } from "react";
import { RelatedApp, defaultApps } from "data/relatedApps";
import { getAdminToken, lockAdmin } from "utils/admin";

export interface DonateConfig {
  enabled: boolean;
  bankId: string;
  bankName: string;
  accountNo: string;
  accountName: string;
}

export interface SiteConfig {
  donate?: DonateConfig;
  apps?: RelatedApp[];
  updatedAt?: string;
}

/** What the donation dialog shows until the owner sets their own account. */
export const DEFAULT_DONATE: DonateConfig = {
  enabled: true,
  bankId: "MB",
  bankName: "MB Bank (Quân Đội)",
  accountNo: "0335888999",
  accountName: "DEVET / MEMCARD"
};

export type StorageState = "unknown" | "none" | "edge-config" | "error" | "unavailable";

export interface SiteConfigState {
  config: SiteConfig | null;
  storage: StorageState; // is the server able to store settings? ("unavailable": no /api, e.g. local dev)
  adminConfigured: boolean | null; // does the server have ADMIN_PASSWORD?
}

const CACHE_KEY = "memcard_site_config";

const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function httpUrl(v: unknown): string {
  try {
    const u = new URL(s(v, 300));
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : "";
  } catch {
    return "";
  }
}

/** Accepts whatever the network (or the cache) returned and keeps only well-formed settings. */
export function normalizeSiteConfig(raw: unknown): SiteConfig | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, any>;
  const out: SiteConfig = {};
  const d = r.donate;
  if (d && typeof d === "object") {
    out.donate = { enabled: d.enabled !== false, bankId: s(d.bankId, 12).toUpperCase(), bankName: s(d.bankName, 60), accountNo: s(d.accountNo, 25), accountName: s(d.accountName, 60) };
  }
  if (Array.isArray(r.apps)) {
    const apps: RelatedApp[] = [];
    r.apps.slice(0, 30).forEach((a: any, i: number) => {
      const name = s(a?.name, 60);
      const url = httpUrl(a?.url);
      if (name && url) apps.push({ id: s(a.id, 40) || `app-${i + 1}`, name, url, icon: s(a.icon, 8) || "🔗", category: s(a.category, 30) || "Công cụ", description: s(a.description, 160) });
    });
    if (apps.length > 0) out.apps = apps;
  }
  if (typeof r.updatedAt === "string") out.updatedAt = r.updatedAt;
  return out;
}

/** The donation account to show: the owner's, else the built-in one. */
export function effectiveDonate(c: SiteConfig | null): DonateConfig {
  const d = c?.donate;
  return d && d.bankId && d.accountNo ? d : DEFAULT_DONATE;
}

export const donateEnabled = (c: SiteConfig | null): boolean => c?.donate?.enabled !== false;

export const effectiveApps = (c: SiteConfig | null): RelatedApp[] => (c?.apps && c.apps.length > 0 ? c.apps : defaultApps);

// ---------- store ----------

function readCache(): SiteConfig | null {
  try {
    return normalizeSiteConfig(JSON.parse(localStorage.getItem(CACHE_KEY) || "null"));
  } catch {
    return null;
  }
}

let state: SiteConfigState = { config: readCache(), storage: "unknown", adminConfigured: null };
const listeners = new Set<() => void>();
const set = (next: Partial<SiteConfigState>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

export const getSiteConfigState = () => state;
export const subscribeSiteConfig = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const useSiteConfigState = (): SiteConfigState => useSyncExternalStore(subscribeSiteConfig, getSiteConfigState);
export const useSiteConfig = (): SiteConfig | null => useSiteConfigState().config;

function cache(config: SiteConfig | null) {
  try {
    if (config) localStorage.setItem(CACHE_KEY, JSON.stringify(config));
    else localStorage.removeItem(CACHE_KEY);
  } catch {}
}

/** Fetches the current settings from the server. Failures keep whatever is cached. */
export async function loadSiteConfig(): Promise<void> {
  try {
    const res = await fetch("/api/config", { headers: { Accept: "application/json" } });
    const data = res.ok && (res.headers.get("content-type") || "").includes("json") ? await res.json() : null;
    if (!data) return set({ storage: "unavailable" });
    const config = normalizeSiteConfig(data.config);
    const storage: StorageState = data.storage === "edge-config" || data.storage === "none" || data.storage === "error" ? data.storage : "unknown";
    // "error" means the server could not read its store right now: keep what we have instead of dropping to defaults
    if (storage === "error") return set({ storage, adminConfigured: Boolean(data.adminConfigured) });
    cache(config);
    set({ config, storage, adminConfigured: Boolean(data.adminConfigured) });
  } catch {
    set({ storage: "unavailable" });
  }
}

export class SiteConfigError extends Error {}

/** Saves the settings for everybody (owner only). Throws SiteConfigError with a message to show. */
export async function saveSiteConfig(config: SiteConfig): Promise<SiteConfig | null> {
  const token = getAdminToken();
  if (!token) throw new SiteConfigError("Bạn chưa đăng nhập quản trị.");
  let res: Response;
  try {
    res = await fetch("/api/config", { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ config }) });
  } catch {
    throw new SiteConfigError("Không kết nối được tới máy chủ. Hãy kiểm tra mạng.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) lockAdmin();
    throw new SiteConfigError(body?.message || `Lưu thất bại (${res.status}).`);
  }
  const saved = normalizeSiteConfig(body?.config);
  cache(saved);
  set({ config: saved });
  return saved;
}
