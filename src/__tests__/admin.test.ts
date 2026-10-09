import { adminLogin, getAdminToken, isAdmin, lockAdmin, viewerMessage } from "utils/admin";
import { classifyDriveError } from "utils/googleDrive";

const original = global.fetch;
afterEach(() => {
  global.fetch = original;
  sessionStorage.clear();
});

function mockLogin(status: number, body: unknown = {}, contentType = "application/json") {
  global.fetch = jest.fn(async () => ({ ok: status >= 200 && status < 300, status, headers: { get: () => contentType }, json: async () => body })) as any;
}

describe("adminLogin", () => {
  test("a correct password stores the signed token for this tab only", async () => {
    mockLogin(200, { token: "abc.def", expiresAt: Date.now() + 1000 * 60 });
    expect(isAdmin()).toBe(false);
    expect(await adminLogin("pw")).toBe("ok");
    expect(isAdmin()).toBe(true);
    expect(getAdminToken()).toBe("abc.def");
    const call = (global.fetch as jest.Mock).mock.calls[0];
    expect(call[0]).toBe("/api/config");
    expect(call[1].method).toBe("POST");
    expect(JSON.parse(call[1].body)).toEqual({ password: "pw" });
    expect(localStorage.getItem("memcard_admin_token")).toBeNull(); // never persisted beyond the tab
  });

  test("maps the server's answers", async () => {
    mockLogin(401);
    expect(await adminLogin("x")).toBe("wrong");
    mockLogin(429);
    expect(await adminLogin("x")).toBe("locked");
    mockLogin(503);
    expect(await adminLogin("x")).toBe("not_configured");
    expect(isAdmin()).toBe(false);
  });

  test("no API (npm start, other hosts) is reported as unavailable", async () => {
    mockLogin(200, "<html>", "text/html");
    expect(await adminLogin("x")).toBe("unavailable");
    global.fetch = jest.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as any;
    expect(await adminLogin("x")).toBe("unavailable");
    expect(isAdmin()).toBe(false);
  });

  test("an expired token is not admin, and locking forgets it", async () => {
    sessionStorage.setItem("memcard_admin_token", JSON.stringify({ token: "t", expiresAt: Date.now() - 1 }));
    expect(isAdmin()).toBe(false);
    sessionStorage.setItem("memcard_admin_token", JSON.stringify({ token: "t", expiresAt: Date.now() + 60000 }));
    expect(isAdmin()).toBe(true);
    lockAdmin();
    expect(isAdmin()).toBe(false);
    expect(getAdminToken()).toBeNull();
  });
});

describe("viewerMessage", () => {
  test("learners get the plain message, the owner also gets the technical detail", () => {
    const err = classifyDriveError(403, { error: { errors: [{ reason: "accessNotConfigured" }] } });
    expect(err.message).not.toContain("Cloud Console");
    expect(viewerMessage(err)).toBe(err.message);
    sessionStorage.setItem("memcard_admin_token", JSON.stringify({ token: "t", expiresAt: Date.now() + 60000 }));
    expect(viewerMessage(err)).toContain("Google Cloud Console");
    expect(viewerMessage(new Error("x"))).toBe("x");
    expect(viewerMessage(null, "fallback")).toBe("fallback");
  });
});
