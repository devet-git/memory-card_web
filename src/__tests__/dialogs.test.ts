import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { act, renderHook } from "@testing-library/react";
import { answerConfirm, confirmDialog, resetDialogs, showToast, useDialogState } from "utils/dialogs";

afterEach(() => {
  resetDialogs();
  jest.useRealTimers();
});

describe("confirmDialog", () => {
  test("resolves with the answer, one dialog at a time", async () => {
    const { result } = renderHook(() => useDialogState());
    let first: Promise<boolean> | undefined;
    let second: Promise<boolean> | undefined;
    act(() => {
      first = confirmDialog({ message: "A?" });
      second = confirmDialog({ message: "B?", danger: true });
    });
    expect(result.current.confirms.map((c) => c.message)).toEqual(["A?", "B?"]);
    act(() => answerConfirm(result.current.confirms[0].id, true));
    await expect(first).resolves.toBe(true);
    expect(result.current.confirms.map((c) => c.message)).toEqual(["B?"]);
    act(() => answerConfirm(result.current.confirms[0].id, false));
    await expect(second).resolves.toBe(false);
    expect(result.current.confirms).toHaveLength(0);
  });

  test("answering twice or an unknown id does nothing", async () => {
    const { result } = renderHook(() => useDialogState());
    let p: Promise<boolean> | undefined;
    act(() => {
      p = confirmDialog({ message: "A?" });
    });
    const id = result.current.confirms[0].id;
    act(() => answerConfirm(id, true));
    act(() => answerConfirm(id, false));
    act(() => answerConfirm(9999, true));
    await expect(p).resolves.toBe(true);
  });
});

describe("showToast", () => {
  test("shows a message and removes it by itself", () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useDialogState());
    act(() => showToast("Xong", "success"));
    expect(result.current.toasts.map((t) => [t.text, t.type])).toEqual([["Xong", "success"]]);
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  test("errors stay longer, and only the latest few are kept", () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useDialogState());
    act(() => showToast("Lỗi", "error"));
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(result.current.toasts).toHaveLength(1);
    act(() => {
      for (let i = 0; i < 6; i++) showToast(`m${i}`);
    });
    expect(result.current.toasts.length).toBeLessThanOrEqual(4);
  });
});

describe("design rule: no browser dialogs", () => {
  const files: string[] = [];
  const walk = (dir: string) =>
    readdirSync(dir).forEach((f) => {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) {
        if (f !== "__tests__") walk(p);
      } else if (/\.(ts|tsx)$/.test(f)) files.push(p);
    });
  walk(join(__dirname, ".."));

  test("source uses confirmDialog / showToast, never alert, confirm or prompt", () => {
    const offenders = files.filter((f) => /(^|[^.\w$])(window\.)?(alert|confirm|prompt)\s*\(/.test(readFileSync(f, "utf8").replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/deferred\.prompt\(\)/g, "")));
    expect(offenders).toEqual([]);
  });
});
