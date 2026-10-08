import React from "react";
import { act, renderHook } from "@testing-library/react";
import useCollectionContext, { CollectionProvider } from "contexts/Collection";

const wrapper = ({ children }: { children: React.ReactNode }) => <CollectionProvider>{children}</CollectionProvider>;

beforeEach(() => localStorage.clear());

function setup() {
  const hook = renderHook(() => useCollectionContext(), { wrapper });
  // Start from a known deck instead of the sample data
  act(() => {
    hook.result.current.importFromJSON(
      JSON.stringify({
        collections: [
          { id: "d1", name: "A", pathname: "a", updatedAt: 1, words: [{ id: "w1", source: "cat", target: "mèo" }, { id: "w2", source: "dog", target: "chó" }] },
          { id: "d2", name: "B", pathname: "b", updatedAt: 1, words: [] }
        ]
      })
    );
  });
  return hook;
}

const wordIds = (hook: ReturnType<typeof setup>, pathname: string) =>
  hook.result.current.collections.find((c) => c.pathname === pathname)!.words.map((w) => String(w.id));

describe("sync with deletions (context)", () => {
  test("a deleted card is not brought back when an older backup is merged", () => {
    const hook = setup();
    const oldBackup = hook.result.current.exportToJSON(); // still contains both cards
    act(() => {
      hook.result.current.deleteWord("a", "w2");
    });
    expect(wordIds(hook, "a")).toEqual(["w1"]);

    act(() => {
      hook.result.current.mergeFromJSON(oldBackup);
    });
    expect(wordIds(hook, "a")).toEqual(["w1"]);
  });

  test("the exported backup carries the deletion to other devices", () => {
    const hook = setup();
    act(() => {
      hook.result.current.deleteWord("a", "w1");
    });
    const exported = JSON.parse(hook.result.current.exportToJSON());
    expect(Object.keys(exported.tombstones.words)).toEqual(["d1::w1"]);
  });

  test("moving a card is not undone by merging a backup taken before the move", () => {
    const hook = setup();
    const before = hook.result.current.exportToJSON();
    act(() => {
      const res = hook.result.current.transferWords({ from: "a", ids: ["w1"], to: "b", mode: "move" });
      expect(res.moved).toBe(1);
    });
    expect(wordIds(hook, "a")).toEqual(["w2"]);
    expect(wordIds(hook, "b")).toEqual(["w1"]);

    act(() => {
      hook.result.current.mergeFromJSON(before);
    });
    expect(wordIds(hook, "a")).toEqual(["w2"]);
    expect(wordIds(hook, "b")).toEqual(["w1"]);
  });

  test("a deleted deck stays deleted after merging an older backup", () => {
    const hook = setup();
    const before = hook.result.current.exportToJSON();
    act(() => {
      hook.result.current.deleteCollection("b");
    });
    act(() => {
      hook.result.current.mergeFromJSON(before);
    });
    expect(hook.result.current.collections.map((c) => c.pathname)).toEqual(["a"]);
  });

  test("copying keeps the original and skips cards already in the target", () => {
    const hook = setup();
    act(() => {
      hook.result.current.transferWords({ from: "a", ids: ["w1"], to: "b", mode: "copy" });
    });
    let second: { moved: number; skipped: number } = { moved: 0, skipped: 0 };
    act(() => {
      second = hook.result.current.transferWords({ from: "a", ids: ["w1"], to: "b", mode: "copy" });
    });
    expect(second).toMatchObject({ moved: 0, skipped: 1 });
    expect(wordIds(hook, "a")).toEqual(["w1", "w2"]);
    expect(wordIds(hook, "b")).toHaveLength(1);
  });
});
