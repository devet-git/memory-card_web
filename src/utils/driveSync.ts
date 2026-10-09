import { contentHash } from "utils/backupHash";
import { DriveError, RemoteFile } from "utils/googleDrive";

// Two-way sync of the MemCard backup with a file on Google Drive.
// Each run: look at the Drive file; if it changed since we last saw it, download and MERGE it into the local
// data (nothing is overwritten); then upload the merged result if it differs from what Drive holds.

export interface SyncMeta {
  remoteModified?: string; // modified time of the Drive file as of our last sync
  pushedHash?: string; // fingerprint of the content we last uploaded or confirmed equal
}

export interface MergeOutcome {
  success: boolean;
  error?: string;
  merged?: string; // the backup of local data after merging, ready to upload
  changed?: boolean; // did the merge change local data
}

export interface SyncDeps {
  token: () => Promise<string>; // throws DriveError("auth") when the user has to sign in again
  list: (token: string) => Promise<RemoteFile[]>;
  download: (token: string, id: string) => Promise<string>;
  upload: (token: string, id: string | null, body: string) => Promise<RemoteFile>;
  exportLocal: () => string;
  mergeRemote: (json: string) => MergeOutcome;
  meta: { get: () => SyncMeta; set: (m: SyncMeta) => void };
}

export interface SyncResult {
  pulled: boolean; // a newer Drive copy was merged into local data
  pushed: boolean; // local data was uploaded
  localChanged: boolean; // merging changed local data
  remoteModified?: string;
  at: number;
}

export class SyncError extends Error {
  code: "invalid_remote" | "conflict";
  constructor(code: "invalid_remote" | "conflict", message: string) {
    super(message);
    this.code = code;
  }
}

const MAX_ATTEMPTS = 3;

const INVALID_REMOTE_MESSAGE = "Tệp memcard_backup.json trên Drive không phải bản sao lưu của MemCard (có thể do ứng dụng khác tạo) nên MemCard không đọc và không ghi đè lên nó.";

/** Does this text look like a MemCard backup? Guards against another app having written a file with the same name. */
export function isMemcardBackup(text: string): boolean {
  try {
    const d = JSON.parse(text);
    return (
      d !== null &&
      typeof d === "object" &&
      !Array.isArray(d) &&
      Array.isArray(d.collections) &&
      d.collections.every((c: any) => c && typeof c === "object" && typeof c.id === "string" && Array.isArray(c.words))
    );
  } catch {
    return false;
  }
}

export async function syncOnce(deps: SyncDeps, now: () => number = Date.now): Promise<SyncResult> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const token = await deps.token();
    const remote = (await deps.list(token))[0] || null;
    const meta = deps.meta.get();

    let pulled = false;
    let localChanged = false;
    let body: string;
    let remoteText: string | null = null;

    if (remote && remote.modifiedTime !== meta.remoteModified) {
      remoteText = await deps.download(token, remote.id);
      if (!isMemcardBackup(remoteText)) throw new SyncError("invalid_remote", INVALID_REMOTE_MESSAGE);
      const outcome = deps.mergeRemote(remoteText);
      if (!outcome.success) throw new SyncError("invalid_remote", `Bản sao lưu trên Drive không đọc được nên MemCard không ghi đè lên nó${outcome.error ? ` (${outcome.error})` : ""}. Hãy kiểm tra tệp memcard_backup.json trên Drive.`);
      pulled = true;
      localChanged = Boolean(outcome.changed);
      body = outcome.merged ?? deps.exportLocal();
    } else {
      body = deps.exportLocal();
    }

    const hash = contentHash(body);
    const equalsRemote = remoteText !== null && contentHash(remoteText) === hash;
    const needsUpload = !remote || (pulled ? !equalsRemote : hash !== meta.pushedHash);

    if (!needsUpload) {
      deps.meta.set({ remoteModified: remote!.modifiedTime, pushedHash: hash });
      return { pulled, pushed: false, localChanged, remoteModified: remote!.modifiedTime, at: now() };
    }

    // Another device may have written while we were merging: look again right before uploading
    const latest = (await deps.list(token))[0] || null;
    if ((remote && latest && latest.modifiedTime !== remote.modifiedTime) || (!remote && latest)) continue;

    const uploaded = await deps.upload(token, remote ? remote.id : null, body);
    deps.meta.set({ remoteModified: uploaded.modifiedTime, pushedHash: hash });
    return { pulled, pushed: true, localChanged, remoteModified: uploaded.modifiedTime, at: now() };
  }
  throw new SyncError("conflict", "Dữ liệu trên Drive liên tục thay đổi từ thiết bị khác. Hãy thử đồng bộ lại sau ít phút.");
}

/** Replaces the Drive file with this device's data (the "overwrite Drive" escape hatch). */
export async function overwriteRemote(deps: Pick<SyncDeps, "token" | "list" | "download" | "upload" | "exportLocal" | "meta">, now: () => number = Date.now): Promise<SyncResult> {
  const token = await deps.token();
  const remote = (await deps.list(token))[0] || null;
  // Even this explicit overwrite only replaces a file that is a MemCard backup
  if (remote && !isMemcardBackup(await deps.download(token, remote.id))) throw new SyncError("invalid_remote", INVALID_REMOTE_MESSAGE);
  const body = deps.exportLocal();
  const uploaded = await deps.upload(token, remote ? remote.id : null, body);
  deps.meta.set({ remoteModified: uploaded.modifiedTime, pushedHash: contentHash(body) });
  return { pulled: false, pushed: true, localChanged: false, remoteModified: uploaded.modifiedTime, at: now() };
}

/** Downloads the Drive file without merging, for the "replace this device's data" escape hatch. */
export async function fetchRemote(deps: Pick<SyncDeps, "token" | "list" | "download">): Promise<{ text: string; modifiedTime: string }> {
  const token = await deps.token();
  const remote = (await deps.list(token))[0];
  if (!remote) throw new DriveError("not_found", "Chưa có bản sao lưu memcard_backup.json nào trên Google Drive của bạn.");
  const text = await deps.download(token, remote.id);
  if (!isMemcardBackup(text)) throw new SyncError("invalid_remote", INVALID_REMOTE_MESSAGE);
  return { text, modifiedTime: remote.modifiedTime };
}
