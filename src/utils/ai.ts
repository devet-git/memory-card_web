// Bring-your-own-key AI client. Requests go straight from the browser to the provider the user
// picked; the key is kept only in this browser's localStorage (never in backups or Drive sync).

export type AIProvider = "anthropic" | "openai" | "gemini";

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

export const AI_PROVIDERS: Record<AIProvider, { label: string; defaultModel: string; keyHint: string; keyUrl: string }> = {
  anthropic: {
    label: "Anthropic (Claude)",
    defaultModel: "claude-haiku-5-5",
    keyHint: "sk-ant-...",
    keyUrl: "https://console.anthropic.com/settings/keys"
  },
  openai: {
    label: "OpenAI (GPT)",
    defaultModel: "gpt-4o-mini",
    keyHint: "sk-...",
    keyUrl: "https://platform.openai.com/api-keys"
  },
  gemini: {
    label: "Google (Gemini)",
    defaultModel: "gemini-2.0-flash",
    keyHint: "AIza...",
    keyUrl: "https://aistudio.google.com/apikey"
  }
};

const STORAGE_KEY = "memcard_ai_config";
const CHANGE_EVENT = "memcard-ai-config-changed";

export function loadAIConfig(): AIConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw) as AIConfig;
    if (cfg && cfg.apiKey && cfg.provider in AI_PROVIDERS) return cfg;
  } catch (e) {}
  return null;
}

export function saveAIConfig(cfg: AIConfig | null) {
  try {
    if (cfg && cfg.apiKey.trim()) localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cfg, apiKey: cfg.apiKey.trim() }));
    else localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export const AI_CHANGE_EVENT = CHANGE_EVENT;

export class AIError extends Error {}

interface AskOptions {
  system?: string;
  maxTokens?: number;
  signal?: AbortSignal;
}

async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data?.error?.message || data?.message || JSON.stringify(data).slice(0, 200);
  } catch {
    return res.statusText;
  }
}

function friendlyStatus(status: number, detail: string): AIError {
  if (status === 401 || status === 403) return new AIError(`API key không hợp lệ hoặc không có quyền (${status}). ${detail}`);
  if (status === 429) return new AIError(`Đã vượt giới hạn hoặc hết hạn mức của API key (429). ${detail}`);
  if (status === 404) return new AIError(`Không tìm thấy model — hãy kiểm tra tên model. ${detail}`);
  return new AIError(`Lỗi từ nhà cung cấp AI (${status}). ${detail}`);
}

/** Sends one prompt and returns the model's text reply. */
export async function askAI(prompt: string, config: AIConfig, opts: AskOptions = {}): Promise<string> {
  const maxTokens = opts.maxTokens ?? 2048;
  let res: Response;

  try {
    if (config.provider === "anthropic") {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: opts.signal,
        headers: {
          "content-type": "application/json",
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: maxTokens,
          ...(opts.system ? { system: opts.system } : {}),
          messages: [{ role: "user", content: prompt }]
        })
      });
    } else if (config.provider === "openai") {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: opts.signal,
        headers: { "content-type": "application/json", authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({
          model: config.model,
          max_tokens: maxTokens,
          messages: [...(opts.system ? [{ role: "system", content: opts.system }] : []), { role: "user", content: prompt }]
        })
      });
    } else {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`,
        {
          method: "POST",
          signal: opts.signal,
          headers: { "content-type": "application/json", "x-goog-api-key": config.apiKey },
          body: JSON.stringify({
            ...(opts.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens }
          })
        }
      );
    }
  } catch (err: any) {
    if (err?.name === "AbortError") throw new AIError("Đã hủy yêu cầu.");
    throw new AIError("Không kết nối được tới nhà cung cấp AI (kiểm tra mạng).");
  }

  if (!res.ok) throw friendlyStatus(res.status, await readError(res));

  const data = await res.json();
  let text = "";
  if (config.provider === "anthropic") {
    text = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
  } else if (config.provider === "openai") {
    text = data.choices?.[0]?.message?.content || "";
  } else {
    text = (data.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || "").join("");
  }
  if (!text.trim()) throw new AIError("AI không trả về nội dung. Hãy thử lại.");
  return text;
}

/** Like askAI but parses the first JSON value in the reply (tolerates ``` fences and chatter). */
export async function askAIJson<T>(prompt: string, config: AIConfig, opts: AskOptions = {}): Promise<T> {
  const text = await askAI(prompt, config, { ...opts, system: `${opts.system || ""}\nReply with valid JSON only, no commentary.`.trim() });
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (start < 0 || end <= start) throw new AIError("Không đọc được kết quả AI. Hãy thử lại.");
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    throw new AIError("AI trả về dữ liệu sai định dạng. Hãy thử lại.");
  }
}
