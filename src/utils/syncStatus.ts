import { useSyncExternalStore } from "react";

// Small store describing what the Google Drive sync is doing, shown in the Drive dialog, the settings and the header.

export type SyncState = "off" | "idle" | "syncing" | "synced" | "error" | "needs-auth";

export interface SyncStatus {
  state: SyncState;
  message?: string; // a human explanation for "error" / "needs-auth"
  lastSync?: number; // timestamp of the last successful sync
  detail?: string; // e.g. "đã tải về và gộp 1 thay đổi"
}

const LAST_SYNC_KEY = "memcard_gdrive_last_sync_ts";
const LEGACY_LAST_SYNC_KEY = "memcard_gdrive_last_sync"; // older versions stored a formatted string

function loadLastSync(): number | undefined {
  try {
    const n = Number(localStorage.getItem(LAST_SYNC_KEY));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  } catch {
    return undefined;
  }
}

let status: SyncStatus = { state: "off", lastSync: loadLastSync() };
const listeners = new Set<() => void>();

export function setSyncStatus(patch: Partial<SyncStatus> & { state: SyncState }) {
  const next: SyncStatus = { ...status, message: undefined, detail: undefined, ...patch };
  if (patch.lastSync) {
    try {
      localStorage.setItem(LAST_SYNC_KEY, String(patch.lastSync));
      localStorage.removeItem(LEGACY_LAST_SYNC_KEY);
    } catch {}
  }
  status = next;
  listeners.forEach((l) => l());
}

export const getSyncStatus = () => status;
export const subscribeSyncStatus = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const useSyncStatus = (): SyncStatus => useSyncExternalStore(subscribeSyncStatus, getSyncStatus);

export const formatSyncTime = (ts: number) => `${new Date(ts).toLocaleTimeString("vi-VN")} ${new Date(ts).toLocaleDateString("vi-VN")}`;

/** For tests. */
export function resetSyncStatus() {
  status = { state: "off", lastSync: loadLastSync() };
  listeners.forEach((l) => l());
}
