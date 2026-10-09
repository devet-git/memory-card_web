import { useCallback, useEffect, useRef } from "react";
import useCollectionContext from "contexts/Collection";
import { SyncDeps } from "utils/driveSync";
import { googleDeps, isSyncBlocked, runSync, unblockSync } from "utils/driveRunner";
import { isConnected, subscribeAuth, getValidToken } from "utils/googleAuth";
import { getSyncStatus, setSyncStatus } from "utils/syncStatus";

const PUSH_DELAY_MS = 8000;
const POLL_MS = 5 * 60 * 1000;
const MIN_GAP_MS = 60 * 1000;

/** SyncDeps bound to the live app data. */
export function useDriveDeps(): SyncDeps {
  const { exportLatest, mergeFromJSON } = useCollectionContext();
  const exportRef = useRef(exportLatest);
  const mergeRef = useRef(mergeFromJSON);
  exportRef.current = exportLatest;
  mergeRef.current = mergeFromJSON;
  return useRef<SyncDeps>({
    ...googleDeps,
    exportLocal: () => exportRef.current(),
    mergeRemote: (json) => mergeRef.current(json)
  }).current;
}

/**
 * Keeps the Google Drive backup and this device in step while "auto sync" is on:
 *  - when switched on / the app opens: a two-way sync (Drive changes are merged in, never overwritten);
 *  - a few seconds after you edit something: the merged data is uploaded;
 *  - when the tab comes back, the device goes online, or every few minutes: Drive is checked for changes from other devices.
 * If Google needs the user to sign in again the sync stops and the status says so (one click on "Kết nối lại").
 */
export default function useAutoSync() {
  const { settings, collections, stats } = useCollectionContext();
  const deps = useDriveDeps();
  const enabled = Boolean(settings.autoSync);
  const lastRun = useRef(0);

  const run = useCallback(
    async (force = false) => {
      if (!force && isSyncBlocked()) return;
      if (typeof navigator !== "undefined" && navigator.onLine === false) return;
      lastRun.current = Date.now();
      await runSync(deps);
    },
    [deps]
  );

  // switched on / app start
  useEffect(() => {
    if (!enabled) {
      if (getSyncStatus().state !== "syncing") setSyncStatus({ state: "off" });
      return;
    }
    if (!isConnected()) {
      setSyncStatus({ state: "needs-auth", message: "Chưa kết nối tài khoản Google." });
      return;
    }
    unblockSync();
    run(true);
  }, [enabled, run]);

  // when the user signs in again, start right away
  useEffect(() => {
    if (!enabled) return;
    return subscribeAuth(() => {
      if (isConnected() && getValidToken() && getSyncStatus().state === "needs-auth") {
        unblockSync();
        run(true);
      }
    });
  }, [enabled, run]);

  // push edits shortly after the last one (skips the very first render)
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!enabled || !isConnected()) return;
    const timer = window.setTimeout(() => run(), PUSH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [collections, stats, enabled, run]);

  // pick up changes made on other devices
  useEffect(() => {
    if (!enabled) return;
    const check = () => {
      if (document.visibilityState === "visible" && Date.now() - lastRun.current > MIN_GAP_MS) run();
    };
    const online = () => {
      if (getSyncStatus().state === "error") run();
    };
    document.addEventListener("visibilitychange", check);
    window.addEventListener("online", online);
    const poll = window.setInterval(check, POLL_MS);
    return () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("online", online);
      window.clearInterval(poll);
    };
  }, [enabled, run]);

}
