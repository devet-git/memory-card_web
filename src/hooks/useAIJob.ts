import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { ModalAIScope } from "components/MyModal";

/**
 * Tracks one running AI request so the UI can show progress, offer "cancel" and warn before throwing
 * away work that is already being billed. The task receives an AbortSignal to pass to askAI/askAIJson.
 *
 * run() resolves to undefined when the request was cancelled (a deliberate action, not an error);
 * real failures are thrown. Unmounting (e.g. closing the modal) aborts the request too.
 */
export default function useAIJob() {
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const scope = useContext(ModalAIScope);

  // Tell the enclosing modal (if any) that closing it now would throw away a running request
  useEffect(() => {
    if (!busy || !scope) return;
    scope.report(true);
    return () => scope.report(false);
  }, [busy, scope]);

  useEffect(() => () => controller.current?.abort(), []);

  const run = useCallback(async <T,>(task: (signal: AbortSignal) => Promise<T>): Promise<T | undefined> => {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    setBusy(true);
    try {
      return await task(ctrl.signal);
    } catch (err) {
      if (ctrl.signal.aborted) return undefined;
      throw err;
    } finally {
      if (controller.current === ctrl) {
        controller.current = null;
        setBusy(false);
      }
    }
  }, []);

  const cancel = useCallback(() => controller.current?.abort(), []);

  // The "are you sure?" prompt disappears by itself if the request finishes while it is open
  useEffect(() => {
    if (!busy) setCancelOpen(false);
  }, [busy]);

  const requestCancel = useCallback(() => setCancelOpen(true), []);
  const dismissCancel = useCallback(() => setCancelOpen(false), []);
  const confirmCancel = useCallback(() => {
    setCancelOpen(false);
    controller.current?.abort();
  }, []);

  return { busy, run, cancel, cancelOpen, requestCancel, dismissCancel, confirmCancel };
}

export { AI_CLOSE_WARNING as AI_CANCEL_MESSAGE } from "components/MyModal";
