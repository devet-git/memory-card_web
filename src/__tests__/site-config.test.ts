import { normalizeSiteConfig, effectiveApps, effectiveDonate, donateEnabled, DEFAULT_DONATE, loadSiteConfig, saveSiteConfig, getSiteConfigState, SiteConfigError } from "utils/siteConfig";
import { defaultApps } from "data/relatedApps";

const original = global.fetch;
afterEach(() => {
  global.fetch = original;
  sessionStorage.clear();
  localStorage.clear();
});

const jsonRes = (status: number, body: unknown) => ({ ok: status < 300, status, headers: { get: () => "application/json" }, json: async () => body });

describe("normalizeSiteConfig", () => {
  test("keeps well-formed settings and drops the rest", () => {
    const c = normalizeSiteConfig({
      donate: { enabled: true, bankId: "vcb", bankName: "VCB", accountNo: "123456", accountName: "A" },
      apps: [
        { id: "1", name: "Good", url: "https://example.com", icon: "🔗", category: "X", description: "d" },
        { id: "2", name: "Bad scheme", url: "javascript:alert(1)" },
        { id: "3", name: "", url: "https://example.com" },
        "nonsense"
      ],
      extra: "ignored"
    });
    expect(c?.donate?.bankId).toBe("VCB");
    expect(c?.apps?.map((a) => a.name)).toEqual(["Good"]);
    expect((c as any).extra).toBeUndefined();
    expect(normalizeSiteConfig("x")).toBeNull();
    expect(normalizeSiteConfig([])).toBeNull();
    expect(normalizeSiteConfig(null)).toBeNull();
  });

  test("falls back to the built-in defaults", () => {
    expect(effectiveApps(null)).toBe(defaultApps);
    expect(effectiveApps({ apps: [] })).toBe(defaultApps);
    expect(effectiveDonate(null)).toBe(DEFAULT_DONATE);
    expect(effectiveDonate({ donate: { enabled: true, bankId: "", bankName: "", accountNo: "", accountName: "" } })).toBe(DEFAULT_DONATE);
    expect(donateEnabled(null)).toBe(true);
    expect(donateEnabled({ donate: { enabled: false, bankId: "MB", bankName: "", accountNo: "1234", accountName: "" } })).toBe(false);
  });
});

describe("loading and saving", () => {
  test("loadSiteConfig stores what the server returns and caches it", async () => {
    global.fetch = jest.fn(async () => jsonRes(200, { config: { donate: { enabled: false, bankId: "MB", accountNo: "1111", bankName: "", accountName: "" } }, storage: "edge-config", adminConfigured: true })) as any;
    await loadSiteConfig();
    const s = getSiteConfigState();
    expect(s.storage).toBe("edge-config");
    expect(s.adminConfigured).toBe(true);
    expect(donateEnabled(s.config)).toBe(false);
    expect(JSON.parse(localStorage.getItem("memcard_site_config")!).donate.accountNo).toBe("1111");
  });

  test("a failing or missing API keeps the last known settings", async () => {
    global.fetch = jest.fn(async () => jsonRes(200, { config: { apps: [{ id: "z", name: "Z", url: "https://z.dev" }] }, storage: "edge-config", adminConfigured: true })) as any;
    await loadSiteConfig();
    global.fetch = jest.fn(async () => {
      throw new TypeError("offline");
    }) as any;
    await loadSiteConfig();
    expect(getSiteConfigState().storage).toBe("unavailable");
    expect(effectiveApps(getSiteConfigState().config)[0].name).toBe("Z");
    global.fetch = jest.fn(async () => jsonRes(200, { config: null, storage: "error", adminConfigured: true })) as any;
    await loadSiteConfig();
    expect(effectiveApps(getSiteConfigState().config)[0].name).toBe("Z"); // a read error does not wipe the settings
  });

  test("saving needs the admin token and sends it", async () => {
    await expect(saveSiteConfig({})).rejects.toBeInstanceOf(SiteConfigError);
    sessionStorage.setItem("memcard_admin_token", JSON.stringify({ token: "tok", expiresAt: Date.now() + 60000 }));
    global.fetch = jest.fn(async () => jsonRes(200, { ok: true, config: { apps: [{ id: "n", name: "New", url: "https://new.dev" }] } })) as any;
    await saveSiteConfig({ apps: [] });
    const call = (global.fetch as jest.Mock).mock.calls[0];
    expect(call[1].method).toBe("PUT");
    expect(call[1].headers.Authorization).toBe("Bearer tok");
    expect(effectiveApps(getSiteConfigState().config)[0].name).toBe("New");
  });

  test("an expired session on save logs the admin out and explains", async () => {
    sessionStorage.setItem("memcard_admin_token", JSON.stringify({ token: "tok", expiresAt: Date.now() + 60000 }));
    global.fetch = jest.fn(async () => jsonRes(401, { message: "Phiên quản trị đã hết hạn." })) as any;
    await expect(saveSiteConfig({})).rejects.toThrow("hết hạn");
    expect(sessionStorage.getItem("memcard_admin_token")).toBeNull();
  });
});
