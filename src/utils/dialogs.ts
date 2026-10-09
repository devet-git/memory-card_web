// In-app replacements for the browser's alert() and confirm(): `confirmDialog` resolves to the user's answer and
// `showToast` shows a short message that fades by itself. Both are drawn by <DialogHost /> (components/DialogHost.tsx).
// Never call window.alert / confirm / prompt (see CLAUDE.md).

import { useSyncExternalStore } from "react";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean; // style the confirm button as destructive
}

export interface ConfirmRequest extends ConfirmOptions {
  id: number;
  resolve: (answer: boolean) => void;
}

export type ToastType = "info" | "success" | "error";

export interface Toast {
  id: number;
  text: string;
  type: ToastType;
}

interface DialogState {
  confirms: ConfirmRequest[];
  toasts: Toast[];
}

let state: DialogState = { confirms: [], toasts: [] };
let nextId = 1;
const listeners = new Set<() => void>();
const set = (next: Partial<DialogState>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

export const useDialogState = (): DialogState =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => state
  );

/** Asks a yes/no question in a dialog. Resolves true on confirm, false on cancel, Escape or clicking outside. */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    set({ confirms: [...state.confirms, { ...options, id: nextId++, resolve }] });
  });
}

export function answerConfirm(id: number, answer: boolean) {
  const req = state.confirms.find((c) => c.id === id);
  if (!req) return;
  set({ confirms: state.confirms.filter((c) => c.id !== id) });
  req.resolve(answer);
}

export function dismissToast(id: number) {
  set({ toasts: state.toasts.filter((t) => t.id !== id) });
}

/** Shows a message for a few seconds (errors stay a little longer). */
export function showToast(text: string, type: ToastType = "info", ms = type === "error" ? 6000 : 3500) {
  const id = nextId++;
  set({ toasts: [...state.toasts.slice(-3), { id, text, type }] });
  setTimeout(() => dismissToast(id), ms);
}

/** For tests. */
export function resetDialogs() {
  state.confirms.forEach((c) => c.resolve(false));
  state = { confirms: [], toasts: [] };
  listeners.forEach((l) => l());
}
