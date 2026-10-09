import { DriveError, downloadBackup, listBackups, uploadBackup } from "utils/googleDrive";
import { AuthError, getAccessToken, invalidateToken, readProfile, refreshSilently } from "utils/googleAuth";
import { SyncDeps, SyncError, SyncMeta, SyncResult, syncOnce } from "utils/driveSync";
import { setSyncStatus } from "utils/syncStatus";

// Runs one sync at a time and reports what happened to the status store.

const metaKey = () => `memcard_gdrive_meta_${readProfile()?.email || "unknown"}`;

/** Sync bookkeeping is per Google account, so switching accounts never skips a pull. */
export const driveMeta = {
  get(): SyncMeta {
    try {
      return JSON.parse(localStorage.getItem(metaKey()) || "{}") as SyncMeta;
    } catch {
      return {};
    }
  },
  set(m: SyncMeta) {
    try {
      localStorage.setItem(metaKey(), JSON.stringify(m));
    } catch {}
  },
  clear() {
    try {
      localStorage.removeItem(metaKey());
    } catch {}
  }
};

export const NEEDS_SIGN_IN = "Phiên Google Drive đã hết hạn. Bấm “Kết nối lại” để tiếp tục đồng bộ.";

/** The part of SyncDeps that talks to Google (everything except the local data). */
export const googleDeps: Pick<SyncDeps, "token" | "list" | "download" | "upload" | "meta"> = {
  token: async () => {
    const token = await getAccessToken();
    if (!token) throw new DriveError("auth", NEEDS_SIGN_IN);
    return token;
  },
  list: listBackups,
  download: downloadBackup,
  upload: uploadBackup,
  meta: driveMeta
};

/** While true, background syncs stop trying (they would only retry a sign-in that needs a click). */
let blocked = false;
export const isSyncBlocked = () => blocked;
export const unblockSync = () => {
  blocked = false;
};

let running: Promise<SyncResult | null> | null = null;
let again = false;

export function describeResult(r: SyncResult): string {
  if (r.pulled && r.localChanged && r.pushed) return "đã gộp thay đổi từ Drive và tải bản mới nhất lên";
  if (r.pulled && r.localChanged) return "đã tải về và gộp thay đổi từ thiết bị khác";
  if (r.pushed) return "đã tải thay đổi của máy này lên Drive";
  return "dữ liệu đã khớp với Drive";
}

function report(err: unknown) {
  if (err instanceof DriveError && err.code === "auth") {
    blocked = true;
    setSyncStatus({ state: "needs-auth", message: NEEDS_SIGN_IN });
  } else if (err instanceof AuthError) {
    blocked = err.code === "interaction_required" || err.code === "denied" || err.code === "scope_missing";
    setSyncStatus({ state: blocked ? "needs-auth" : "error", message: err.message });
  } else if (err instanceof DriveError || err instanceof SyncError) {
    setSyncStatus({ state: "error", message: err.message });
  } else {
    setSyncStatus({ state: "error", message: (err as Error)?.message || "Đồng bộ thất bại." });
  }
}

/**
 * Runs a sync; calls made while one is running are folded into one extra run afterwards.
 * Resolves to the result, or null after reporting an error to the status store.
 */
export function runSync(deps: SyncDeps): Promise<SyncResult | null> {
  if (running) {
    again = true;
    return running;
  }
  setSyncStatus({ state: "syncing" });
  running = (async () => {
    try {
      let result: SyncResult;
      try {
        result = await syncOnce(deps);
      } catch (err) {
        // a 401 means the token is dead: try once more with a silently refreshed one
        if (err instanceof DriveError && err.code === "auth") {
          invalidateToken();
          if (!(await refreshSilently())) throw err;
          result = await syncOnce(deps);
        } else throw err;
      }
      while (again) {
        again = false;
        result = await syncOnce(deps);
      }
      blocked = false;
      setSyncStatus({ state: "synced", lastSync: result.at, detail: describeResult(result) });
      return result;
    } catch (err) {
      report(err);
      return null;
    } finally {
      running = null;
      again = false;
    }
  })();
  return running;
}

export const isSyncRunning = () => running !== null;
