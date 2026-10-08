import { useEffect, useRef } from "react";
import useCollectionContext from "contexts/Collection";
import { getAccessToken, restoreFromGoogleDrive, syncToGoogleDrive } from "utils/googleDrive";

const PUSH_DELAY_MS = 8000;
export const LAST_SYNC_KEY = "memcard_gdrive_last_sync";

/**
 * When "auto sync" is on and the Google Drive session is alive:
 *  1. on enable / app start, pull the Drive backup and MERGE it into local data (never overwrite);
 *  2. afterwards, push local changes a few seconds after the last edit.
 * Needs a valid Drive token (valid ~1h after sign-in); otherwise it quietly does nothing.
 */
export default function useAutoSync() {
  const { settings, collections, stats, exportToJSON, mergeFromJSON } = useCollectionContext();
  const ready = useRef(false);
  const exportRef = useRef(exportToJSON);
  exportRef.current = exportToJSON;

  useEffect(() => {
    ready.current = false;
    if (!settings.autoSync) return;
    let cancelled = false;
    (async () => {
      try {
        if (!(await getAccessToken())) return;
        const res = await restoreFromGoogleDrive();
        if (cancelled) return;
        if (res.success && res.data) mergeFromJSON(JSON.stringify(res.data));
        // No backup yet (or pull failed) is fine: the first push will create it
        ready.current = true;
      } catch (e) {}
    })();
    return () => {
      cancelled = true;
    };
  }, [settings.autoSync, mergeFromJSON]);

  useEffect(() => {
    if (!settings.autoSync || !ready.current) return;
    const timer = setTimeout(async () => {
      try {
        if (!(await getAccessToken())) return;
        const res = await syncToGoogleDrive(exportRef.current());
        if (res.success) {
          const now = new Date();
          localStorage.setItem(LAST_SYNC_KEY, `${now.toLocaleTimeString("vi-VN")} ${now.toLocaleDateString("vi-VN")}`);
        }
      } catch (e) {}
    }, PUSH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [collections, stats, settings.autoSync]);
}
