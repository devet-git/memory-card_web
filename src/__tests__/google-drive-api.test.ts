import { classifyDriveError, listBackups, downloadBackup, uploadBackup, DriveError, BACKUP_FILE_NAME } from "utils/googleDrive";

const original = global.fetch;
afterEach(() => {
  global.fetch = original;
});

interface Call {
  url: string;
  init: RequestInit;
}
function mockFetch(handler: (c: Call) => { status?: number; json?: unknown; text?: string } | Error) {
  const calls: Call[] = [];
  global.fetch = jest.fn(async (url: any, init: any = {}) => {
    const c = { url: String(url), init };
    calls.push(c);
    const out = handler(c);
    if (out instanceof Error) throw out;
    const status = out.status ?? 200;
    return { ok: status >= 200 && status < 300, status, json: async () => out.json ?? {}, text: async () => out.text ?? "" } as any;
  }) as any;
  return calls;
}

describe("classifyDriveError", () => {
  test("maps the failures people actually hit to actionable messages", () => {
    expect(classifyDriveError(401, null)).toMatchObject({ code: "auth" });
    const disabled = classifyDriveError(403, { error: { message: "Google Drive API has not been used in project 123 before or it is disabled.", errors: [{ reason: "accessNotConfigured" }] } });
    expect(disabled.code).toBe("api_disabled");
    expect(disabled.message).toContain("quản trị viên");
    expect(disabled.detail).toContain("Google Drive API");
    expect(classifyDriveError(403, { error: { errors: [{ reason: "insufficientPermissions" }] } }).code).toBe("permission");
    expect(classifyDriveError(403, { error: { details: [{ reason: "SERVICE_DISABLED" }] } }).code).toBe("api_disabled");
    expect(classifyDriveError(403, { error: { errors: [{ reason: "userRateLimitExceeded" }] } }).code).toBe("quota");
    expect(classifyDriveError(403, { error: { errors: [{ reason: "storageQuotaExceeded" }] } }).message).toContain("đầy");
    expect(classifyDriveError(429, null).code).toBe("quota");
    expect(classifyDriveError(404, null).code).toBe("not_found");
    expect(classifyDriveError(500, { error: { message: "boom" } })).toMatchObject({ code: "other", status: 500 });
    expect(classifyDriveError(403, null).code).toBe("permission");
  });
});

describe("Drive requests", () => {
  test("listBackups asks for the newest files first and parses the answer", async () => {
    const tag = { app: "memcard" };
    const calls = mockFetch(() => ({ json: { files: [{ id: "a", modifiedTime: "2026-02-01T00:00:00.000Z", appProperties: tag }, { id: "b", modifiedTime: "2026-01-01T00:00:00.000Z", appProperties: tag }] } }));
    const files = await listBackups("tok");
    expect(files).toEqual([
      { id: "a", modifiedTime: "2026-02-01T00:00:00.000Z" },
      { id: "b", modifiedTime: "2026-01-01T00:00:00.000Z" }
    ]);
    const url = decodeURIComponent(calls[0].url);
    expect(url).toContain(`name = '${BACKUP_FILE_NAME}'`);
    expect(url).toContain("trashed = false");
    expect(url).toContain("'me' in owners");
    expect(url).toContain("orderBy=modifiedTime desc");
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  test("listBackups only returns files that are safe to touch", async () => {
    const t = "2026-01-01T00:00:00.000Z";
    const other = { id: "other", modifiedTime: t, appProperties: { app: "some-other-app" } };
    const legacy = { id: "legacy", modifiedTime: t };
    const mine = { id: "mine", modifiedTime: t, appProperties: { app: "memcard" } };
    mockFetch(() => ({ json: { files: [other, legacy, mine] } }));
    expect((await listBackups("t")).map((f) => f.id)).toEqual(["mine"]); // tagged files win over untagged ones
    mockFetch(() => ({ json: { files: [other, legacy] } }));
    expect((await listBackups("t")).map((f) => f.id)).toEqual(["legacy"]); // falls back to untagged (older MemCard versions), never another app's file
    mockFetch(() => ({ json: { files: [other] } }));
    expect(await listBackups("t")).toEqual([]);
  });

  test("listBackups returns an empty list when there is no backup", async () => {
    mockFetch(() => ({ json: {} }));
    expect(await listBackups("t")).toEqual([]);
  });

  test("downloadBackup returns the raw text", async () => {
    const calls = mockFetch(() => ({ text: '{"a":1}' }));
    expect(await downloadBackup("t", "id 1")).toBe('{"a":1}');
    expect(calls[0].url).toContain("/files/id%201?alt=media");
  });

  test("uploadBackup updates an existing file in place, tags it, keeps its name and returns the server's time", async () => {
    const calls = mockFetch(() => ({ json: { id: "f", modifiedTime: "2026-03-03T03:03:03.000Z" } }));
    const r = await uploadBackup("t", "f", '{"x":1}');
    expect(r).toEqual({ id: "f", modifiedTime: "2026-03-03T03:03:03.000Z" });
    expect(calls).toHaveLength(1);
    expect(calls[0].init.method).toBe("PATCH");
    expect(calls[0].url).toContain("/files/f?uploadType=multipart");
    const body = String(calls[0].init.body);
    expect(body).toContain('"appProperties":{"app":"memcard"}');
    expect(body).not.toContain('"name"');
    expect(body).toContain('{"x":1}');
  });

  test("uploadBackup creates the file with a multipart body that carries the name and the content", async () => {
    const calls = mockFetch(() => ({ json: { id: "new", modifiedTime: "2026-03-03T03:03:03.000Z" } }));
    const r = await uploadBackup("t", null, '{"x":1}');
    expect(r.id).toBe("new");
    expect(calls[0].init.method).toBe("POST");
    const type = (calls[0].init.headers as Record<string, string>)["Content-Type"];
    const boundary = type.split("boundary=")[1];
    const body = String(calls[0].init.body);
    expect(body.startsWith(`--${boundary}`)).toBe(true);
    expect(body.endsWith(`--${boundary}--`)).toBe(true);
    expect(body).toContain(`"name":"${BACKUP_FILE_NAME}"`);
    expect(body).toContain('"appProperties":{"app":"memcard"}');
    expect(body).toContain('{"x":1}');
  });

  test("HTTP errors become DriveError with the right code", async () => {
    mockFetch(() => ({ status: 403, json: { error: { errors: [{ reason: "accessNotConfigured" }], message: "disabled" } } }));
    await expect(listBackups("t")).rejects.toMatchObject({ code: "api_disabled" });
    mockFetch(() => ({ status: 401, json: {} }));
    await expect(downloadBackup("t", "x")).rejects.toMatchObject({ code: "auth" });
  });

  test("MemCard never sends a DELETE request", async () => {
    const calls = mockFetch(() => ({ json: { files: [], id: "x", modifiedTime: "t" } }));
    await listBackups("t");
    await uploadBackup("t", null, "{}");
    await uploadBackup("t", "x", "{}");
    expect(calls.map((c) => c.init.method || "GET").filter((m) => m === "DELETE")).toEqual([]);
  });

  test("a network failure is reported as such", async () => {
    mockFetch(() => new TypeError("Failed to fetch"));
    const err = await listBackups("t").catch((e) => e);
    expect(err).toBeInstanceOf(DriveError);
    expect(err.code).toBe("network");
  });
});
