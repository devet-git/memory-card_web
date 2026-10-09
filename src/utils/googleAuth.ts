// Google sign-in through Google Identity Services (GIS), used only to get an access token for the
// user's own Google Drive. Nothing is sent to any server of ours: the token lives in this browser.

export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
export const SCOPES = `openid email profile ${DRIVE_SCOPE}`;

// Used when neither a custom id (set in the app) nor GOOGLE_CLIENT_ID is provided.
const DEFAULT_CLIENT_ID = "41227230020-a5aidkq57u0lq2bqt7q6d64e0kmb25gk.apps.googleusercontent.com";

const CLIENT_ID_KEY = "memcard_gdrive_client_id";
const TOKEN_KEY = "memcard_gdrive_token";
const PROFILE_KEY = "memcard_gdrive_profile";
const GIS_URL = "https://accounts.google.com/gsi/client";
const EXPIRY_MARGIN_MS = 60 * 1000;
const SILENT_TIMEOUT_MS = 8000;
const INTERACTIVE_TIMEOUT_MS = 120000;

export type AuthErrorCode =
  | "script_blocked" // the Google script could not be loaded (offline, blocked by an extension or CSP)
  | "popup_blocked"
  | "popup_closed"
  | "denied" // the user refused, or the OAuth client does not allow this account (test users)
  | "scope_missing" // the Drive checkbox was not ticked on the consent screen
  | "interaction_required" // a silent refresh needs the user (consent or sign-in)
  | "timeout"
  | "unknown";

export class AuthError extends Error {
  code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export interface Profile {
  name: string;
  email: string;
  picture?: string;
}

export interface StoredToken {
  token: string;
  expiresAt: number;
}

// ---------- configuration ----------

export type ClientIdSource = "custom" | "env" | "default";

export const looksLikeClientId = (s: string) => /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/i.test(s.trim());

function readCustomClientId(): string {
  try {
    return localStorage.getItem(CLIENT_ID_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function clientIdSource(): ClientIdSource {
  if (readCustomClientId()) return "custom";
  if ((process.env.REACT_APP_GOOGLE_CLIENT_ID || "").trim()) return "env";
  return "default";
}

/** Custom id (entered in the app) > GOOGLE_CLIENT_ID (build time, mapped by scripts/cra.mjs) > the built-in default. */
export function getClientId(): string {
  return readCustomClientId() || (process.env.REACT_APP_GOOGLE_CLIENT_ID || "").trim() || DEFAULT_CLIENT_ID;
}

/** Saves (or clears, with null/empty) a client id and forgets the current Google session, which belongs to the old one. */
export function setCustomClientId(id: string | null): void {
  try {
    if (id && id.trim()) localStorage.setItem(CLIENT_ID_KEY, id.trim());
    else localStorage.removeItem(CLIENT_ID_KEY);
  } catch {}
  forgetSession();
}

// ---------- stored session ----------

export function readToken(now = Date.now()): StoredToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as StoredToken;
    if (t && typeof t.token === "string" && typeof t.expiresAt === "number" && now < t.expiresAt) return t;
  } catch {}
  return null;
}

function writeToken(t: StoredToken | null) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export function readProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Profile;
    if (p && typeof p.email === "string") return p;
  } catch {}
  return null;
}

function writeProfile(p: Profile | null) {
  try {
    if (p) localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    else localStorage.removeItem(PROFILE_KEY);
  } catch {}
}

function forgetSession() {
  writeToken(null);
  writeProfile(null);
  notify();
}

// ---------- change notifications (for useSyncExternalStore) ----------

type Listener = () => void;
const listeners = new Set<Listener>();
let version = 0;

function notify() {
  version++;
  listeners.forEach((l) => l());
}

export const subscribeAuth = (l: Listener) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const getAuthVersion = () => version;

// ---------- Google Identity Services ----------

interface TokenResponse {
  access_token?: string;
  expires_in?: number | string;
  error?: string;
  error_description?: string;
}
interface TokenClient {
  requestAccessToken: (overrides?: { prompt?: string; hint?: string }) => void;
}
interface GoogleOAuth2 {
  initTokenClient: (cfg: {
    client_id: string;
    scope: string;
    prompt?: string;
    hint?: string;
    callback: (r: TokenResponse) => void;
    error_callback?: (e: { type?: string; message?: string }) => void;
  }) => TokenClient;
  hasGrantedAllScopes: (r: TokenResponse, ...scopes: string[]) => boolean;
  revoke: (token: string, done?: () => void) => void;
}

const gis = (): GoogleOAuth2 | undefined => (window as any).google?.accounts?.oauth2;

let loading: Promise<GoogleOAuth2> | null = null;

export function loadGis(): Promise<GoogleOAuth2> {
  const ready = gis();
  if (ready) return Promise.resolve(ready);
  if (loading) return loading;
  loading = new Promise<GoogleOAuth2>((resolve, reject) => {
    const fail = () => {
      loading = null;
      document.querySelector(`script[src="${GIS_URL}"]`)?.remove();
      reject(new AuthError("script_blocked", "Không tải được thư viện đăng nhập của Google. Hãy kiểm tra kết nối mạng và tắt trình chặn quảng cáo cho trang này."));
    };
    const script = document.createElement("script");
    script.src = GIS_URL;
    script.async = true;
    script.onload = () => {
      const api = gis();
      if (api) resolve(api);
      else fail();
    };
    script.onerror = fail;
    document.head.appendChild(script);
    window.setTimeout(() => {
      if (!gis()) fail();
    }, 15000);
  });
  return loading;
}

interface RequestOptions {
  prompt: "" | "none" | "consent" | "select_account";
  hint?: string;
}

/** Asks Google for an access token. Without a prompt it may open a popup, so call it from a click. */
export async function requestToken({ prompt, hint }: RequestOptions): Promise<StoredToken> {
  const api = await loadGis();
  const timeout = prompt === "none" ? SILENT_TIMEOUT_MS : INTERACTIVE_TIMEOUT_MS;
  return new Promise<StoredToken>((resolve, reject) => {
    let settled = false;
    const done = (fn: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      fn();
    };
    const timer = window.setTimeout(
      () => done(() => reject(new AuthError(prompt === "none" ? "interaction_required" : "timeout", prompt === "none" ? "Cần đăng nhập lại." : "Hết thời gian chờ đăng nhập Google."))),
      timeout
    );
    try {
      const client = api.initTokenClient({
        client_id: getClientId(),
        scope: SCOPES,
        callback: (r) =>
          done(() => {
            if (r.error || !r.access_token) {
              const code: AuthErrorCode =
                r.error === "access_denied" ? "denied" : ["interaction_required", "login_required", "consent_required"].includes(r.error || "") ? "interaction_required" : "unknown";
              return reject(new AuthError(code, r.error_description || r.error || "Google từ chối cấp quyền."));
            }
            if (!api.hasGrantedAllScopes(r, DRIVE_SCOPE)) {
              return reject(new AuthError("scope_missing", "Bạn chưa cấp quyền truy cập Google Drive. Khi đăng nhập hãy tích chọn ô cho phép xem và quản lý tệp do MemCard tạo."));
            }
            const seconds = Number(r.expires_in) || 3600;
            resolve({ token: r.access_token, expiresAt: Date.now() + seconds * 1000 - EXPIRY_MARGIN_MS });
          }),
        error_callback: (e) =>
          done(() => {
            if (e?.type === "popup_failed_to_open") return reject(new AuthError("popup_blocked", "Trình duyệt đã chặn cửa sổ đăng nhập. Hãy cho phép cửa sổ bật lên (popup) cho trang này rồi thử lại."));
            if (e?.type === "popup_closed") return reject(new AuthError(prompt === "none" ? "interaction_required" : "popup_closed", "Cửa sổ đăng nhập đã bị đóng."));
            reject(new AuthError("unknown", e?.message || "Đăng nhập Google thất bại."));
          })
      });
      client.requestAccessToken({ prompt, ...(hint ? { hint } : {}) });
    } catch (err: any) {
      done(() => reject(new AuthError("unknown", err?.message || "Đăng nhập Google thất bại.")));
    }
  });
}

async function fetchProfile(token: string): Promise<Profile> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new AuthError("unknown", "Không đọc được thông tin tài khoản Google.");
  const d = await res.json();
  return { name: d.name || d.email || "Người dùng Google", email: d.email || "", picture: d.picture };
}

// ---------- public API ----------

/** Interactive sign-in (call it from a button). `chooseAccount` lets the user pick another Google account. */
export async function signIn(opts: { chooseAccount?: boolean; forceConsent?: boolean } = {}): Promise<Profile> {
  const token = await requestToken({ prompt: opts.forceConsent ? "consent" : opts.chooseAccount ? "select_account" : "" });
  writeToken(token);
  let profile = readProfile();
  try {
    profile = await fetchProfile(token.token);
    writeProfile(profile);
  } catch {
    if (!profile) profile = { name: "Người dùng Google", email: "" };
    writeProfile(profile);
  }
  notify();
  return profile;
}

/** A token that is still valid, or null. Never opens anything. */
export const getValidToken = (): string | null => readToken()?.token ?? null;

/** Tries to get a fresh token without any screen. Works only for a user who already connected and is still signed in to Google. */
export async function refreshSilently(): Promise<string | null> {
  const profile = readProfile();
  if (!profile) return null;
  try {
    const token = await requestToken({ prompt: "none", hint: profile.email || undefined });
    writeToken(token);
    notify();
    return token.token;
  } catch {
    return null;
  }
}

/** Valid token, else one silent refresh attempt. */
export async function getAccessToken(): Promise<string | null> {
  return getValidToken() ?? (await refreshSilently());
}

/**
 * Forgets the session on this browser. The token is deliberately NOT revoked at Google: a revoke removes the user's
 * consent for the whole OAuth client, which would sign out every other app that shares the same Client ID.
 * The access token expires by itself within an hour.
 */
export async function signOut(): Promise<void> {
  forgetSession();
}

/** Connected = the user signed in on this browser before (the token itself may have expired). */
export const isConnected = () => readProfile() !== null;

/** Called when Drive answers 401: the stored token is no good any more. */
export function invalidateToken() {
  writeToken(null);
  notify();
}
