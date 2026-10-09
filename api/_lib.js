// Server side of the owner's site settings (Vercel serverless function, see api/config.js and docs/ADMIN.md).
//
//   GET  /api/config  public: the current settings (everybody's app reads this)
//   POST /api/config  {password} -> {token}: owner login. The password is checked HERE, with ADMIN_PASSWORD (a server-only variable)
//   PUT  /api/config  Bearer token + settings: validates them and stores them in Vercel Edge Config
//
// Everything is injectable (env, fetch, clock) so it can be tested without Vercel.

const crypto = require("node:crypto");

const ITEM_KEY = "siteConfig";
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
const MAX_BYTES = 7500; // Edge Config on the free plan holds 8 KB in total
const MAX_FAILS = 5;
const LOCKOUT_MS = 60 * 1000;
const FAIL_DELAY_MS = 700;

const b64url = (buf) => Buffer.from(buf).toString("base64url");
const sha256 = (s) => crypto.createHash("sha256").update(String(s)).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha256(a), sha256(b));

function signToken(secret, exp) {
  const payload = b64url(JSON.stringify({ exp }));
  const sig = b64url(crypto.createHmac("sha256", secret).update(payload).digest());
  return `${payload}.${sig}`;
}

function verifyToken(secret, token, now) {
  if (!secret || typeof token !== "string") return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = b64url(crypto.createHmac("sha256", secret).update(payload).digest());
  if (!safeEqual(sig, expected)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof exp === "number" && exp > now;
  } catch {
    return false;
  }
}

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function cleanUrl(v) {
  try {
    const u = new URL(str(v, 300));
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : "";
  } catch {
    return "";
  }
}

/** Validates the settings the owner sent and keeps only the fields we know. Returns {config} or {error}. */
function sanitizeConfig(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "Cấu hình không hợp lệ." };
  const out = {};

  if (input.donate !== undefined && input.donate !== null) {
    const d = input.donate;
    if (typeof d !== "object" || Array.isArray(d)) return { error: "Mục ủng hộ không hợp lệ." };
    const enabled = d.enabled !== false;
    const bankId = str(d.bankId, 12).toUpperCase();
    const accountNo = str(d.accountNo, 25).replace(/\s+/g, "");
    if (enabled) {
      if (!/^[A-Z0-9]{2,12}$/.test(bankId)) return { error: "Mã ngân hàng không hợp lệ (VD: MB, VCB, TCB)." };
      if (!/^[0-9A-Za-z]{4,25}$/.test(accountNo)) return { error: "Số tài khoản không hợp lệ." };
    }
    out.donate = { enabled, bankId, bankName: str(d.bankName, 60), accountNo, accountName: str(d.accountName, 60) };
  }

  if (input.apps !== undefined && input.apps !== null) {
    if (!Array.isArray(input.apps) || input.apps.length > 30) return { error: "Danh sách ứng dụng liên quan tối đa 30 mục." };
    const apps = [];
    for (const [i, a] of input.apps.entries()) {
      const name = str(a && a.name, 60);
      const url = cleanUrl(a && a.url);
      if (!name || !url) return { error: `Ứng dụng thứ ${i + 1} cần có tên và địa chỉ http(s) hợp lệ.` };
      apps.push({
        id: str(a.id, 40) || `app-${i + 1}`,
        name,
        url,
        icon: str(a.icon, 8) || "🔗",
        category: str(a.category, 30) || "Công cụ",
        description: str(a.description, 160)
      });
    }
    out.apps = apps;
  }

  return { config: out };
}

function parseBody(req) {
  const b = req.body;
  if (b && typeof b === "object") return b;
  if (typeof b === "string" && b) {
    try {
      return JSON.parse(b);
    } catch {
      return null;
    }
  }
  return {};
}

// Vercel's connection string for the store: https://edge-config.vercel.com/ecfg_xxx?token=yyy.
// Stores created as "Global Config" expose it as GLOBAL_CONFIG instead of EDGE_CONFIG, so both names are accepted.
function edgeConfigParts(env) {
  try {
    const u = new URL(env.EDGE_CONFIG || env.GLOBAL_CONFIG);
    const id = u.pathname.replace(/^\//, "");
    const token = u.searchParams.get("token");
    return id && token ? { origin: u.origin, id, token } : null;
  } catch {
    return null;
  }
}

function createHandler({ env, fetchImpl, now = () => Date.now(), sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
  const fails = new Map(); // ip -> {count, until}; best effort (per serverless instance)

  const clientIp = (req) => String((req.headers && (req.headers["x-forwarded-for"] || req.headers["x-real-ip"])) || "unknown").split(",")[0].trim();

  async function readStored() {
    const ec = edgeConfigParts(env);
    if (!ec) return { storage: "none", config: null };
    const res = await fetchImpl(`${ec.origin}/${ec.id}/item/${ITEM_KEY}?token=${encodeURIComponent(ec.token)}`);
    if (res.status === 404) return { storage: "edge-config", config: null };
    if (!res.ok) throw new Error(`Edge Config trả về ${res.status}`);
    return { storage: "edge-config", config: await res.json() };
  }

  async function writeStored(config) {
    const ec = edgeConfigParts(env);
    if (!ec || !env.VERCEL_API_TOKEN) return { missing: !ec ? "EDGE_CONFIG (hoặc GLOBAL_CONFIG)" : "VERCEL_API_TOKEN" };
    const team = env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(env.VERCEL_TEAM_ID)}` : "";
    const res = await fetchImpl(`https://api.vercel.com/v1/edge-config/${ec.id}/items${team}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${env.VERCEL_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ operation: "upsert", key: ITEM_KEY, value: config }] })
    });
    if (!res.ok) {
      let detail = "";
      try {
        const j = await res.json();
        detail = (j && j.error && (j.error.message || j.error.code)) || "";
      } catch {}
      return { error: `Vercel từ chối ghi cấu hình (${res.status}${detail ? `: ${detail}` : ""}).` };
    }
    return {};
  }

  return async function handler(req, res) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    const send = (code, body) => res.status(code).json(body);

    if (req.method === "GET") {
      try {
        const { storage, config } = await readStored();
        res.setHeader("Cache-Control", "public, s-maxage=15, stale-while-revalidate=60");
        return send(200, { config, storage, adminConfigured: Boolean(env.ADMIN_PASSWORD) });
      } catch (err) {
        res.setHeader("Cache-Control", "no-store");
        return send(200, { config: null, storage: "error", adminConfigured: Boolean(env.ADMIN_PASSWORD) });
      }
    }

    res.setHeader("Cache-Control", "no-store");

    if (req.method === "POST") {
      if (!env.ADMIN_PASSWORD) return send(503, { error: "not_configured", message: "Chưa đặt biến môi trường ADMIN_PASSWORD trên máy chủ." });
      const ip = clientIp(req);
      const f = fails.get(ip) || { count: 0, until: 0 };
      if (f.until > now()) return send(429, { error: "locked", message: "Thử sai quá nhiều lần. Hãy đợi một phút." });
      const body = parseBody(req);
      if (!body || typeof body.password !== "string" || !safeEqual(body.password, env.ADMIN_PASSWORD)) {
        const count = f.count + 1;
        fails.set(ip, count >= MAX_FAILS ? { count: 0, until: now() + LOCKOUT_MS } : { count, until: 0 });
        await sleep(FAIL_DELAY_MS);
        return send(401, { error: "wrong_password", message: "Sai mật khẩu." });
      }
      fails.delete(ip);
      const exp = now() + TOKEN_TTL_MS;
      return send(200, { token: signToken(env.ADMIN_PASSWORD, exp), expiresAt: exp });
    }

    if (req.method === "PUT") {
      const auth = String((req.headers && req.headers.authorization) || "");
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      if (!verifyToken(env.ADMIN_PASSWORD, token, now())) return send(401, { error: "unauthorized", message: "Phiên quản trị đã hết hạn. Hãy đăng nhập lại." });
      const body = parseBody(req);
      const result = sanitizeConfig(body && body.config);
      if (result.error) return send(400, { error: "invalid", message: result.error });
      const config = { ...result.config, updatedAt: new Date(now()).toISOString() };
      if (Buffer.byteLength(JSON.stringify(config)) > MAX_BYTES) {
        return send(400, { error: "too_large", message: "Cấu hình quá lớn (Edge Config bản miễn phí giới hạn 8KB). Hãy rút gọn mô tả hoặc bớt ứng dụng." });
      }
      const written = await writeStored(config);
      if (written.missing) return send(503, { error: "not_configured", message: `Chưa cấu hình nơi lưu: thiếu biến môi trường ${written.missing} trên máy chủ. Xem docs/ADMIN.md.` });
      if (written.error) return send(502, { error: "write_failed", message: written.error });
      return send(200, { ok: true, config });
    }

    res.setHeader("Allow", "GET, POST, PUT");
    return send(405, { error: "method_not_allowed" });
  };
}

module.exports = { createHandler, sanitizeConfig, signToken, verifyToken, ITEM_KEY, TOKEN_TTL_MS, MAX_BYTES };
