import { anthropicContent, openaiContent, geminiParts, askAI, AIConfig } from "utils/ai";
import { parseVisionWords, MAX_VISION_WORDS } from "utils/visionWords";
import { fitWithin, MAX_SIDE } from "utils/image";

const img = { mediaType: "image/jpeg", data: "QUJD" };

describe("attaching images", () => {
  test("without images the prompt is sent as plain text", () => {
    expect(anthropicContent("hi")).toBe("hi");
    expect(openaiContent("hi", [])).toBe("hi");
    expect(geminiParts("hi")).toEqual([{ text: "hi" }]);
  });

  test("each provider gets its own image format", () => {
    expect(anthropicContent("hi", [img])).toEqual([
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: "QUJD" } },
      { type: "text", text: "hi" }
    ]);
    expect(openaiContent("hi", [img])).toEqual([
      { type: "text", text: "hi" },
      { type: "image_url", image_url: { url: "data:image/jpeg;base64,QUJD" } }
    ]);
    expect(geminiParts("hi", [img])).toEqual([{ inline_data: { mime_type: "image/jpeg", data: "QUJD" } }, { text: "hi" }]);
  });
});

describe("askAI with an image", () => {
  const original = global.fetch;
  afterEach(() => {
    global.fetch = original;
  });

  const run = async (provider: AIConfig["provider"], reply: unknown) => {
    const calls: { url: string; body: any }[] = [];
    global.fetch = jest.fn(async (url: any, init: any) => {
      calls.push({ url: String(url), body: JSON.parse(init.body) });
      return { ok: true, json: async () => reply } as any;
    }) as any;
    const text = await askAI("read this", { provider, apiKey: "k", model: "m" }, { system: "sys", images: [img] });
    return { text, call: calls[0] };
  };

  test("Anthropic", async () => {
    const { text, call } = await run("anthropic", { content: [{ type: "text", text: "ok" }] });
    expect(text).toBe("ok");
    expect(call.url).toContain("anthropic.com");
    expect(call.body.messages[0].content[0]).toMatchObject({ type: "image" });
    expect(call.body.system).toBe("sys");
  });

  test("OpenAI", async () => {
    const { text, call } = await run("openai", { choices: [{ message: { content: "ok" } }] });
    expect(text).toBe("ok");
    const user = call.body.messages.find((m: any) => m.role === "user");
    expect(user.content[1].image_url.url).toBe("data:image/jpeg;base64,QUJD");
  });

  test("Gemini", async () => {
    const { text, call } = await run("gemini", { candidates: [{ content: { parts: [{ text: "ok" }] } }] });
    expect(text).toBe("ok");
    expect(call.body.contents[0].parts[0].inline_data.mime_type).toBe("image/jpeg");
  });
});

describe("parseVisionWords", () => {
  test("keeps usable items, tidies them and drops duplicates and known words", () => {
    const raw = [
      { word: " Menu ", meaning: "thực đơn", example: "Today's   menu" },
      { word: "menu", meaning: "trùng" },
      { word: "“Appetizer”,", meaning: "món khai vị" },
      { word: "salt", meaning: "muối" },
      { word: "x", meaning: "quá ngắn" },
      { word: "empty", meaning: "" },
      { source: "dessert", target: "món tráng miệng" },
      "not an object",
      null
    ];
    const out = parseVisionWords(raw, new Set(["salt"]));
    expect(out.map((o) => o.word)).toEqual(["Menu", "Appetizer", "dessert"]);
    expect(out[0]).toEqual({ word: "Menu", meaning: "thực đơn", example: "Today's menu" });
    expect(out[2].meaning).toBe("món tráng miệng");
  });

  test("accepts an object wrapper and rejects anything else", () => {
    expect(parseVisionWords({ words: [{ word: "tea", meaning: "trà" }] })).toHaveLength(1);
    expect(parseVisionWords("nope")).toEqual([]);
    expect(parseVisionWords(null)).toEqual([]);
    expect(parseVisionWords({})).toEqual([]);
  });

  test("limits the number of words and the length of fields", () => {
    const many = Array.from({ length: 80 }, (_, i) => ({ word: `word${String.fromCharCode(97 + (i % 26))}${i}`, meaning: "m".repeat(500) }));
    const out = parseVisionWords(many);
    expect(out).toHaveLength(MAX_VISION_WORDS);
    expect(out[0].meaning.length).toBeLessThanOrEqual(140);
  });
});

test("fitWithin only shrinks and keeps the aspect ratio", () => {
  expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  expect(fitWithin(4000, 2000)).toEqual({ width: MAX_SIDE, height: MAX_SIDE / 2 });
  expect(fitWithin(1000, 5000, 1000)).toEqual({ width: 200, height: 1000 });
  expect(fitWithin(0, 0)).toEqual({ width: 0, height: 0 });
});
