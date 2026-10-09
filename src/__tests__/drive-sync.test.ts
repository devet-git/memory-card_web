import { syncOnce, overwriteRemote, fetchRemote, isMemcardBackup, SyncDeps, SyncError, SyncMeta, MergeOutcome } from "utils/driveSync";
import { contentHash } from "utils/backupHash";
import { DriveError, RemoteFile } from "utils/googleDrive";

// A tiny fake Drive: one file whose content is JSON {items: number[]}; local data is a set of numbers.
function setup(opts: { local?: number[]; remote?: number[] | string | null } = {}) {
  let clock = 1000;
  const drive: { id: string; text: string; modifiedTime: string } | null = opts.remote === null || opts.remote === undefined ? null : { id: "f1", text: typeof opts.remote === "string" ? opts.remote : JSON.stringify({ collections: [], items: opts.remote }), modifiedTime: `t${clock++}` };
  const state = { drive, local: new Set(opts.local || []), meta: {} as SyncMeta, calls: { list: 0, download: 0, upload: 0 }, beforeUpload: undefined as undefined | (() => void) };
  const body = () => JSON.stringify({ exportDate: new Date().toISOString(), collections: [], items: Array.from(state.local).sort() });
  const deps: SyncDeps = {
    token: async () => "tok",
    list: async () => {
      state.calls.list++;
      return state.drive ? [{ id: state.drive.id, modifiedTime: state.drive.modifiedTime }] : [];
    },
    download: async () => {
      state.calls.download++;
      return state.drive!.text;
    },
    upload: async (_t, id, text): Promise<RemoteFile> => {
      state.calls.upload++;
      state.beforeUpload?.();
      state.drive = { id: id || "f1", text, modifiedTime: `t${clock++}` };
      return { id: state.drive.id, modifiedTime: state.drive.modifiedTime };
    },
    exportLocal: body,
    mergeRemote: (json): MergeOutcome => {
      try {
        const remote = JSON.parse(json).items as number[];
        const before = state.local.size;
        remote.forEach((n) => state.local.add(n));
        return { success: true, changed: state.local.size !== before, merged: body() };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    meta: { get: () => state.meta, set: (m) => (state.meta = m) }
  };
  const remoteItems = () => JSON.parse(state.drive!.text).items as number[];
  return { state, deps, remoteItems, advance: () => (clock += 10), bump: (items: number[]) => (state.drive = { id: "f1", text: JSON.stringify({ collections: [], items }), modifiedTime: `t${clock++}` }) };
}

describe("contentHash", () => {
  test("ignores the export date and key spacing, notices real changes", () => {
    const a = JSON.stringify({ exportDate: "2026-01-01", items: [1, 2] }, null, 2);
    const b = JSON.stringify({ exportDate: "2027-05-05", items: [1, 2] });
    expect(contentHash(a)).toBe(contentHash(b));
    expect(contentHash(a)).not.toBe(contentHash(JSON.stringify({ items: [1, 3] })));
    expect(contentHash("not json")).toBe(contentHash("not json"));
  });
});

describe("syncOnce", () => {
  test("first sync creates the Drive file", async () => {
    const s = setup({ local: [1, 2] });
    const r = await syncOnce(s.deps);
    expect(r).toMatchObject({ pulled: false, pushed: true });
    expect(s.remoteItems()).toEqual([1, 2]);
    expect(s.state.meta.remoteModified).toBe(s.state.drive!.modifiedTime);
  });

  test("nothing changed on either side: no download, no upload", async () => {
    const s = setup({ local: [1, 2] });
    await syncOnce(s.deps);
    s.state.calls = { list: 0, download: 0, upload: 0 };
    const r = await syncOnce(s.deps);
    expect(r).toMatchObject({ pulled: false, pushed: false });
    expect(s.state.calls).toEqual({ list: 1, download: 0, upload: 0 });
  });

  test("a local edit is uploaded without downloading anything", async () => {
    const s = setup({ local: [1] });
    await syncOnce(s.deps);
    s.state.calls = { list: 0, download: 0, upload: 0 };
    s.state.local.add(2);
    const r = await syncOnce(s.deps);
    expect(r).toMatchObject({ pulled: false, pushed: true });
    expect(s.state.calls.download).toBe(0);
    expect(s.remoteItems()).toEqual([1, 2]);
  });

  test("changes from another device are merged in and the union is uploaded", async () => {
    const s = setup({ local: [1] });
    await syncOnce(s.deps);
    s.bump([1, 9]); // another device added 9
    s.state.local.add(2); // and this one added 2
    const r = await syncOnce(s.deps);
    expect(r).toMatchObject({ pulled: true, pushed: true, localChanged: true });
    expect(Array.from(s.state.local).sort()).toEqual([1, 2, 9]);
    expect(s.remoteItems()).toEqual([1, 2, 9]);
  });

  test("a newer Drive copy that adds nothing new to this device is not uploaded back", async () => {
    const s = setup({ local: [1, 2] });
    await syncOnce(s.deps);
    s.bump([1, 2]); // touched on another device but same content
    s.state.calls = { list: 0, download: 0, upload: 0 };
    const r = await syncOnce(s.deps);
    expect(r).toMatchObject({ pulled: true, pushed: false, localChanged: false });
    expect(s.state.calls.upload).toBe(0);
  });

  test("a fresh device pulls the existing backup and keeps its own data too", async () => {
    const s = setup({ local: [5], remote: [1, 2] });
    const r = await syncOnce(s.deps);
    expect(r).toMatchObject({ pulled: true, pushed: true });
    expect(s.remoteItems()).toEqual([1, 2, 5]);
  });

  test("an unreadable Drive file is never overwritten", async () => {
    const s = setup({ local: [1], remote: "{ this is not json" });
    await expect(syncOnce(s.deps)).rejects.toMatchObject({ code: "invalid_remote" });
    expect(s.state.calls.upload).toBe(0);
    expect(s.state.drive!.text).toBe("{ this is not json");
  });

  test("if another device writes while we merge, it starts over instead of overwriting", async () => {
    const s = setup({ local: [1], remote: [1] });
    await syncOnce(s.deps);
    s.bump([1, 7]); // changed since our last sync
    s.state.local.add(2); // we have something to upload
    let injected = false;
    const originalList = s.deps.list;
    let lists = 0;
    s.deps.list = async (t) => {
      lists++;
      // the second list (right before upload) shows yet another change from a third device
      if (lists === 2 && !injected) {
        injected = true;
        s.bump([1, 7, 8]);
      }
      return originalList(t);
    };
    const r = await syncOnce(s.deps);
    expect(r.pushed).toBe(true);
    expect(s.remoteItems()).toEqual([1, 2, 7, 8]);
  });

  test("gives up with a clear error when Drive keeps changing", async () => {
    const s = setup({ local: [1], remote: [1] });
    await syncOnce(s.deps);
    s.state.local.add(2);
    const originalList = s.deps.list;
    let n = 0;
    s.deps.list = async (t) => {
      if (n++ % 2 === 1) s.bump([1, 100 + n]); // another device writes just before every "before upload" check
      return originalList(t);
    };
    await expect(syncOnce(s.deps)).rejects.toBeInstanceOf(SyncError);
  });

  test("a missing sign-in surfaces as an auth error", async () => {
    const s = setup({ local: [1] });
    s.deps.token = async () => {
      throw new DriveError("auth", "x");
    };
    await expect(syncOnce(s.deps)).rejects.toMatchObject({ code: "auth" });
  });
});

describe("escape hatches", () => {
  test("overwriteRemote replaces the Drive file with local data", async () => {
    const s = setup({ local: [3], remote: [1, 2] });
    await overwriteRemote(s.deps);
    expect(s.remoteItems()).toEqual([3]);
    expect(s.state.meta.remoteModified).toBe(s.state.drive!.modifiedTime);
  });

  test("overwriteRemote creates the file when there is none", async () => {
    const s = setup({ local: [3] });
    await overwriteRemote(s.deps);
    expect(s.remoteItems()).toEqual([3]);
  });

  test("fetchRemote returns the file text, or a clear error when there is no backup", async () => {
    const s = setup({ remote: [1] });
    expect((await fetchRemote(s.deps)).text).toContain('"items":[1]');
    const none = setup();
    await expect(fetchRemote(none.deps)).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("never touches a file that is not a MemCard backup", () => {
  const foreign = JSON.stringify({ notes: [{ title: "another app" }] });

  test("isMemcardBackup accepts backups and rejects other JSON", () => {
    expect(isMemcardBackup(JSON.stringify({ version: 3, collections: [{ id: "a", words: [] }] }))).toBe(true);
    expect(isMemcardBackup(JSON.stringify({ collections: [] }))).toBe(true);
    expect(isMemcardBackup(foreign)).toBe(false);
    expect(isMemcardBackup("[]")).toBe(false);
    expect(isMemcardBackup("not json")).toBe(false);
    expect(isMemcardBackup(JSON.stringify({ collections: [{ name: "no id or words" }] }))).toBe(false);
  });

  test("sync refuses to merge into or overwrite a foreign file", async () => {
    const s = setup({ local: [1], remote: foreign });
    await expect(syncOnce(s.deps)).rejects.toMatchObject({ code: "invalid_remote" });
    expect(s.state.calls.upload).toBe(0);
    expect(s.state.drive!.text).toBe(foreign);
  });

  test("the explicit overwrite and the replace-local fetch refuse a foreign file too", async () => {
    const s = setup({ local: [1], remote: foreign });
    await expect(overwriteRemote(s.deps)).rejects.toMatchObject({ code: "invalid_remote" });
    await expect(fetchRemote(s.deps)).rejects.toMatchObject({ code: "invalid_remote" });
    expect(s.state.calls.upload).toBe(0);
    expect(s.state.drive!.text).toBe(foreign);
  });
});
