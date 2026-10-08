import { act, renderHook } from "@testing-library/react";
import useAIJob from "hooks/useAIJob";

describe("useAIJob", () => {
  test("is busy while the task runs and returns its value", async () => {
    const { result } = renderHook(() => useAIJob());
    let finish: (v: string) => void = () => {};
    let promise: Promise<string | undefined>;
    act(() => {
      promise = result.current.run(() => new Promise<string>((r) => (finish = r)));
    });
    expect(result.current.busy).toBe(true);
    await act(async () => {
      finish("kết quả");
      await expect(promise).resolves.toBe("kết quả");
    });
    expect(result.current.busy).toBe(false);
  });

  test("cancel aborts the signal and resolves to undefined instead of an error", async () => {
    const { result } = renderHook(() => useAIJob());
    let seen: AbortSignal | undefined;
    let promise: Promise<string | undefined>;
    act(() => {
      promise = result.current.run(
        (signal) =>
          new Promise<string>((_, reject) => {
            seen = signal;
            signal.addEventListener("abort", () => reject(new Error("Đã hủy yêu cầu.")));
          })
      );
    });
    await act(async () => {
      result.current.cancel();
      await expect(promise).resolves.toBeUndefined();
    });
    expect(seen!.aborted).toBe(true);
    expect(result.current.busy).toBe(false);
  });

  test("real failures are thrown to the caller", async () => {
    const { result } = renderHook(() => useAIJob());
    await act(async () => {
      await expect(result.current.run(async () => Promise.reject(new Error("API key sai")))).rejects.toThrow("API key sai");
    });
    expect(result.current.busy).toBe(false);
  });

  test("unmounting aborts a running request", () => {
    const { result, unmount } = renderHook(() => useAIJob());
    let seen: AbortSignal | undefined;
    act(() => {
      result.current.run((signal) => {
        seen = signal;
        return new Promise<string>(() => {});
      });
    });
    unmount();
    expect(seen!.aborted).toBe(true);
  });

  test("the cancel prompt opens, confirms by aborting, and closes by itself when the request ends", async () => {
    const { result } = renderHook(() => useAIJob());
    let finish: (v: string) => void = () => {};
    act(() => {
      result.current.run(() => new Promise<string>((r) => (finish = r)));
    });
    act(() => result.current.requestCancel());
    expect(result.current.cancelOpen).toBe(true);
    await act(async () => {
      finish("done");
    });
    expect(result.current.cancelOpen).toBe(false);
  });
});
