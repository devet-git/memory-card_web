// Minimal Google Drive client for one JSON backup file. The scope is drive.file, so MemCard can only
// see files it created itself (never the rest of the user's Drive).

export { getAccessToken } from "utils/googleAuth";

export const BACKUP_FILE_NAME = "memcard_backup.json";
const API = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const REQUEST_TIMEOUT_MS = 30000;

export type DriveErrorCode =
  | "auth" // token missing, expired or revoked
  | "api_disabled" // the Google Drive API is not enabled for the OAuth client's project
  | "permission" // the token lacks the Drive scope, or the account may not use this client
  | "quota" // rate limit or storage full
  | "network"
  | "not_found"
  | "other";

export class DriveError extends Error {
  code: DriveErrorCode;
  status?: number;
  detail?: string; // technical hint for the app owner (see viewerMessage in utils/admin.ts); learners only see `message`
  constructor(code: DriveErrorCode, message: string, status?: number, detail?: string) {
    super(message);
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

export interface RemoteFile {
  id: string;
  modifiedTime: string;
}

interface GoogleErrorBody {
  error?: { code?: number; message?: string; status?: string; errors?: { reason?: string }[]; details?: { reason?: string; metadata?: { activationUrl?: string } }[] };
}

/** Turns a failed Drive response into an error whose message tells the user what to do. */
export function classifyDriveError(status: number, body: GoogleErrorBody | null): DriveError {
  const err = body?.error;
  const reasons = [...(err?.errors || []).map((e) => e.reason), ...(err?.details || []).map((d) => d.reason)].filter(Boolean) as string[];
  const has = (...r: string[]) => reasons.some((x) => r.includes(x));
  const text = err?.message || "";

  if (status === 401) return new DriveError("auth", "Phiên đăng nhập Google đã hết hạn. Hãy kết nối lại.", status);
  if (status === 403 && (has("accessNotConfigured", "SERVICE_DISABLED") || /has not been used|is disabled|accessNotConfigured/i.test(text))) {
    return new DriveError(
      "api_disabled",
      "Đồng bộ Google Drive tạm thời chưa dùng được do cấu hình phía ứng dụng. Dữ liệu trên máy của bạn vẫn an toàn; hãy thử lại sau hoặc báo cho quản trị viên.",
      status,
      "Google Drive API chưa được bật cho dự án chứa OAuth Client ID này. Hãy bật “Google Drive API” trong Google Cloud Console (APIs & Services → Library), đợi một–hai phút rồi thử lại."
    );
  }
  if (status === 403 && has("insufficientPermissions", "ACCESS_TOKEN_SCOPE_INSUFFICIENT")) {
    return new DriveError("permission", "Tài khoản chưa cấp quyền Google Drive. Hãy ngắt kết nối rồi đăng nhập lại và tích chọn quyền truy cập Drive.", status);
  }
  if (status === 403 && has("rateLimitExceeded", "userRateLimitExceeded", "dailyLimitExceeded", "RATE_LIMIT_EXCEEDED")) {
    return new DriveError("quota", "Google đang giới hạn số yêu cầu. Hãy thử lại sau ít phút.", status);
  }
  if (status === 403 && has("storageQuotaExceeded")) {
    return new DriveError("quota", "Dung lượng Google Drive của bạn đã đầy.", status);
  }
  if (status === 429) return new DriveError("quota", "Google đang giới hạn số yêu cầu. Hãy thử lại sau ít phút.", status);
  if (status === 404) return new DriveError("not_found", "Không tìm thấy tệp sao lưu trên Google Drive.", status);
  if (status === 403) return new DriveError("permission", "Google từ chối quyền truy cập Drive. Hãy thử kết nối lại.", status, text || undefined);
  return new DriveError("other", `Lỗi Google Drive (${status}).`, status, text || undefined);
}

async function request(url: string, token: string, init: RequestInit = {}): Promise<Response> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: ctrl.signal, headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) } });
  } catch (err: any) {
    throw new DriveError("network", err?.name === "AbortError" ? "Google Drive phản hồi quá lâu. Hãy thử lại." : "Không kết nối được tới Google Drive. Hãy kiểm tra mạng.");
  } finally {
    window.clearTimeout(timer);
  }
  if (!res.ok) throw classifyDriveError(res.status, await res.json().catch(() => null));
  return res;
}

/** Every file MemCard writes is tagged with this, so it can tell its own file from anything another app put in the same Drive. */
export const APP_TAG = { app: "memcard" } as const;

interface RawFile {
  id?: unknown;
  modifiedTime?: unknown;
  appProperties?: Record<string, string> | null;
}

/**
 * MemCard's backup files, newest first (duplicates can exist if two devices created one at once).
 * Only files that are safe to touch are returned: files tagged by MemCard, or, when there are none, untagged files with
 * the same name (backups written by earlier MemCard versions, which are tagged on the next upload). A file tagged by
 * another app is never returned, so a Google Cloud project shared by several apps cannot lead MemCard to overwrite theirs.
 */
export async function listBackups(token: string): Promise<RemoteFile[]> {
  const q = encodeURIComponent(`name = '${BACKUP_FILE_NAME}' and trashed = false and 'me' in owners`);
  const res = await request(`${API}/files?q=${q}&spaces=drive&orderBy=modifiedTime%20desc&pageSize=20&fields=files(id,modifiedTime,appProperties)`, token);
  const data = await res.json();
  const files: RawFile[] = Array.isArray(data.files) ? data.files : [];
  const toRemote = (f: RawFile): RemoteFile => ({ id: String(f.id), modifiedTime: String(f.modifiedTime) });
  const own = files.filter((f) => f.appProperties?.app === APP_TAG.app);
  if (own.length > 0) return own.map(toRemote);
  return files.filter((f) => !f.appProperties?.app).map(toRemote);
}

export async function downloadBackup(token: string, id: string): Promise<string> {
  const res = await request(`${API}/files/${encodeURIComponent(id)}?alt=media`, token);
  return res.text();
}

/** Creates the backup (id = null) or replaces the content of one found by listBackups. Never deletes anything. */
export async function uploadBackup(token: string, id: string | null, json: string): Promise<RemoteFile> {
  const boundary = "memcard" + Math.random().toString(36).slice(2);
  // An update keeps the existing name; both create and update (re)apply the MemCard tag
  const metadata = id
    ? { mimeType: "application/json", appProperties: APP_TAG }
    : { name: BACKUP_FILE_NAME, mimeType: "application/json", description: "MemCard flashcard backup (auto-sync)", appProperties: APP_TAG };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${json}\r\n--${boundary}--`;
  const url = id ? `${UPLOAD}/files/${encodeURIComponent(id)}?uploadType=multipart&fields=id,modifiedTime` : `${UPLOAD}/files?uploadType=multipart&fields=id,modifiedTime`;
  const res = await request(url, token, {
    method: id ? "PATCH" : "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body
  });
  const d = await res.json();
  return { id: String(d.id || id), modifiedTime: String(d.modifiedTime || new Date().toISOString()) };
}
