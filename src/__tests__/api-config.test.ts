// The Vercel function behind the admin console (api/_lib.js), run against a fake Edge Config / Vercel API.
export {};
const { createHandler, sanitizeConfig, signToken, verifyToken } = require("../../api/_lib");

const ENV = {
  ADMIN_PASSWORD: "correct horse battery staple",
  EDGE_CONFIG: "https://edge-config.vercel.com/ecfg_abc?token=readtoken",
  VERCEL_API_TOKEN: "apitoken"
};

function setup(env: Record<string, string | undefined> = ENV, startAt = 1_000_000) {
  let clock = startAt;
  const store: { value: any } = { value: undefined };
  const calls: { url: string; init?: any }[] = [];
  const fetchImpl = jest.fn(async (url: string, init?: any) => {
    calls.push({ url, init });
    if (url.startsWith("https://edge-config.vercel.com/")) {
      return store.value === undefined ? { ok: false, status: 404, json: async () => ({}) } : { ok: true, status: 200, json: async () => store.value };
    }
    if (url.startsWith("https://api.vercel.com/")) {
      store.value = JSON.parse(init.body).items[0].value;
      return { ok: true, status: 200, json: async () => ({ status: "ok" }) };
    }
    throw new Error("unexpected " + url);
  });
  const handler = createHandler({ env, fetchImpl, now: () => clock, sleep: async () => {} });
  const call = async (method: string, opts: { body?: any; token?: string; ip?: string } = {}) => {
    const headers: Record<string, string> = { "x-forwarded-for": opts.ip || "1.1.1.1" };
    if (opts.token) headers.authorization = `Bearer ${opts.token}`;
    const out: { status: number; body: any; headers: Record<string, string> } = { status: 0, body: undefined, headers: {} };
    const res = {
      setHeader: (k: string, v: string) => (out.headers[k] = v),
      status: (c: number) => ({
        json: (b: any) => {
          out.status = c;
          out.body = b;
        }
      })
    };
    await handler({ method, headers, body: opts.body }, res);
    return out;
  };
  const login = async (password = ENV.ADMIN_PASSWORD) => (await call("POST", { body: { password } })).body.token as string;
  return { call, login, store, calls, tick: (ms: number) => (clock += ms) };
}

const goodConfig = { donate: { enabled: true, bankId: "vcb", accountNo: "123 456 789", bankName: "Vietcombank", accountName: "NGUYEN VAN A" }, apps: [{ name: "Site", url: "https://example.com", description: "x" }] };

describe("login", () => {
  test("the right password returns a token, a wrong one does not", async () => {
    const s = setup();
    const ok = await s.call("POST", { body: { password: ENV.ADMIN_PASSWORD } });
    expect(ok.status).toBe(200);
    expect(typeof ok.body.token).toBe("string");
    expect((await s.call("POST", { body: { password: "nope" } })).status).toBe(401);
    expect((await s.call("POST", { body: {} })).status).toBe(401);
  });

  test("without ADMIN_PASSWORD on the server nobody can log in", async () => {
    const s = setup({ ...ENV, ADMIN_PASSWORD: undefined });
    expect((await s.call("POST", { body: { password: "" } })).status).toBe(503);
    expect((await s.call("POST", { body: { password: "anything" } })).status).toBe(503);
  });

  test("five wrong passwords lock that address for a minute, even for the right password", async () => {
    const s = setup();
    for (let i = 0; i < 5; i++) expect((await s.call("POST", { body: { password: "x" } })).status).toBe(401);
    expect((await s.call("POST", { body: { password: ENV.ADMIN_PASSWORD } })).status).toBe(429);
    expect((await s.call("POST", { body: { password: ENV.ADMIN_PASSWORD }, ip: "9.9.9.9" })).status).toBe(200); // someone else is unaffected
    s.tick(61_000);
    expect((await s.call("POST", { body: { password: ENV.ADMIN_PASSWORD } })).status).toBe(200);
  });
});

describe("tokens", () => {
  test("signed with the password, expire, and cannot be forged", () => {
    const t = signToken("secret", 5000);
    expect(verifyToken("secret", t, 4000)).toBe(true);
    expect(verifyToken("secret", t, 6000)).toBe(false); // expired
    expect(verifyToken("other", t, 4000)).toBe(false); // wrong key (e.g. the password was changed)
    const [payload] = t.split(".");
    expect(verifyToken("secret", `${payload}.AAAA`, 4000)).toBe(false);
    const forged = Buffer.from(JSON.stringify({ exp: 9e15 })).toString("base64url");
    expect(verifyToken("secret", `${forged}.${t.split(".")[1]}`, 4000)).toBe(false);
    expect(verifyToken("secret", "garbage", 4000)).toBe(false);
    expect(verifyToken("", t, 4000)).toBe(false);
  });
});

describe("saving", () => {
  test("rejects a missing, bad or expired token and does not write", async () => {
    const s = setup();
    expect((await s.call("PUT", { body: { config: goodConfig } })).status).toBe(401);
    expect((await s.call("PUT", { body: { config: goodConfig }, token: "x.y" })).status).toBe(401);
    const token = await s.login();
    s.tick(9 * 60 * 60 * 1000);
    expect((await s.call("PUT", { body: { config: goodConfig }, token })).status).toBe(401);
    expect(s.calls.filter((c) => c.url.startsWith("https://api.vercel.com"))).toHaveLength(0);
  });

  test("stores sanitized settings in Edge Config and reads them back for everybody", async () => {
    const s = setup();
    const token = await s.login();
    const put = await s.call("PUT", { body: { config: goodConfig }, token });
    expect(put.status).toBe(200);
    const write = s.calls.find((c) => c.url.startsWith("https://api.vercel.com"))!;
    expect(write.url).toBe("https://api.vercel.com/v1/edge-config/ecfg_abc/items");
    expect(write.init.method).toBe("PATCH");
    expect(write.init.headers.Authorization).toBe("Bearer apitoken");
    const stored = s.store.value;
    expect(stored.donate).toEqual({ enabled: true, bankId: "VCB", accountNo: "123456789", bankName: "Vietcombank", accountName: "NGUYEN VAN A" });
    expect(stored.apps[0]).toMatchObject({ name: "Site", url: "https://example.com/", icon: "🔗" });
    expect(stored.updatedAt).toBeTruthy();

    const get = await s.call("GET");
    expect(get.status).toBe(200);
    expect(get.body).toMatchObject({ storage: "edge-config", adminConfigured: true });
    expect(get.body.config.donate.bankId).toBe("VCB");
    expect(get.headers["Cache-Control"]).toContain("s-maxage");
    expect(JSON.stringify(get.body)).not.toContain(ENV.ADMIN_PASSWORD);
  });

  test("works with a store that rejects upsert (404 Edge Config Item not found)", async () => {
    let value: any;
    const ops: string[] = [];
    const fetchImpl = jest.fn(async (url: string, init?: any) => {
      if (url.startsWith("https://edge-config.vercel.com/")) return value === undefined ? { ok: false, status: 404, json: async () => ({}) } : { ok: true, status: 200, json: async () => value };
      const item = JSON.parse(init.body).items[0];
      ops.push(item.operation);
      if (item.operation === "upsert") return { ok: false, status: 404, json: async () => ({ error: { message: "Edge Config Item not found." } }) };
      if (item.operation === "update" && value === undefined) return { ok: false, status: 404, json: async () => ({ error: { message: "Edge Config Item not found." } }) };
      if (item.operation === "create" && value !== undefined) return { ok: false, status: 409, json: async () => ({ error: { message: "exists" } }) };
      value = item.value;
      return { ok: true, status: 200, json: async () => ({}) };
    });
    const handler = createHandler({ env: ENV, fetchImpl, now: () => 1_000_000, sleep: async () => {} });
    const call = async (method: string, body: any, token?: string) => {
      const out: any = {};
      await handler({ method, headers: token ? { authorization: `Bearer ${token}` } : {}, body }, { setHeader() {}, status: (c: number) => ({ json: (b: any) => Object.assign(out, { status: c, body: b }) }) });
      return out;
    };
    const token = signToken(ENV.ADMIN_PASSWORD, 2_000_000);
    expect((await call("PUT", { config: goodConfig }, token)).status).toBe(200); // first save creates the item
    expect((await call("PUT", { config: { ...goodConfig, apps: [] } }, token)).status).toBe(200); // later saves update it
    expect(ops).toEqual(["create", "update"]);
    expect(value.donate.bankId).toBe("VCB");
  });

  test("a team-owned store is addressed with teamId", async () => {
    const s = setup({ ...ENV, VERCEL_TEAM_ID: "team_123" });
    await s.call("PUT", { body: { config: goodConfig }, token: await s.login() });
    expect(s.calls.find((c) => c.url.startsWith("https://api.vercel.com"))!.url).toContain("?teamId=team_123");
  });

  test("a store exposed as GLOBAL_CONFIG works the same as EDGE_CONFIG", async () => {
    const s = setup({ ADMIN_PASSWORD: ENV.ADMIN_PASSWORD, VERCEL_API_TOKEN: ENV.VERCEL_API_TOKEN, GLOBAL_CONFIG: ENV.EDGE_CONFIG });
    expect((await s.call("PUT", { body: { config: goodConfig }, token: await s.login() })).status).toBe(200);
    expect((await s.call("GET")).body).toMatchObject({ storage: "edge-config" });
  });

  test("reports what is missing instead of failing silently", async () => {
    const s = setup({ ...ENV, VERCEL_API_TOKEN: undefined });
    const r = await s.call("PUT", { body: { config: goodConfig }, token: await s.login() });
    expect(r.status).toBe(503);
    expect(r.body.message).toContain("VERCEL_API_TOKEN");
    const none = setup({ ADMIN_PASSWORD: ENV.ADMIN_PASSWORD });
    expect((await none.call("GET")).body).toMatchObject({ config: null, storage: "none" });
  });

  test("a Vercel failure is surfaced", async () => {
    const s = setup();
    const token = await s.login();
    (s.calls as any).length = 0;
    const handler = createHandler({
      env: ENV,
      fetchImpl: async () => ({ ok: false, status: 403, json: async () => ({ error: { message: "forbidden" } }) }),
      now: () => 1_000_000,
      sleep: async () => {}
    });
    const out: any = {};
    await handler(
      { method: "PUT", headers: { authorization: `Bearer ${signToken(ENV.ADMIN_PASSWORD, 2_000_000)}` }, body: { config: goodConfig } },
      { setHeader() {}, status: (c: number) => ({ json: (b: any) => Object.assign(out, { status: c, body: b }) }) }
    );
    expect(token).toBeTruthy();
    expect(out.status).toBe(502);
    expect(out.body.message).toContain("403");
  });

  test("other methods are refused", async () => {
    const s = setup();
    expect((await s.call("DELETE")).status).toBe(405);
  });
});

describe("sanitizeConfig", () => {
  test("rejects bad accounts, bad links and oversized lists", () => {
    expect(sanitizeConfig(null).error).toBeTruthy();
    expect(sanitizeConfig({ donate: { enabled: true, bankId: "!!", accountNo: "123456" } }).error).toContain("ngân hàng");
    expect(sanitizeConfig({ donate: { enabled: true, bankId: "MB", accountNo: "12" } }).error).toContain("tài khoản");
    expect(sanitizeConfig({ apps: [{ name: "x", url: "javascript:alert(1)" }] }).error).toContain("http");
    expect(sanitizeConfig({ apps: [{ name: "", url: "https://a.dev" }] }).error).toBeTruthy();
    expect(sanitizeConfig({ apps: Array.from({ length: 31 }, () => ({ name: "a", url: "https://a.dev" })) }).error).toContain("30");
  });

  test("a disabled donation does not need account details, and unknown fields are dropped", () => {
    const r = sanitizeConfig({ donate: { enabled: false }, evil: "x", apps: [{ name: "A", url: "https://a.dev", extra: 1 }] });
    expect(r.config.donate.enabled).toBe(false);
    expect(r.config.evil).toBeUndefined();
    expect(r.config.apps[0].extra).toBeUndefined();
  });

  test("an oversized payload is refused before it reaches Edge Config", async () => {
    const s = setup();
    const token = await s.login();
    const big = { apps: Array.from({ length: 30 }, (_, i) => ({ name: "n".repeat(60), url: "https://example.com/" + "a".repeat(200) + i, description: "d".repeat(160), category: "c".repeat(30) })) };
    const r = await s.call("PUT", { body: { config: big }, token });
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("too_large");
  });
});
