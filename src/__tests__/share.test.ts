import { TextDecoder, TextEncoder } from "util";
import { CollectionItem } from "types";

Object.assign(global, { TextEncoder, TextDecoder });

// jsdom has no CompressionStream, so this exercises the uncompressed ("j.") format
import { encodeDeck, decodeDeck } from "utils/share";

const deck: CollectionItem = {
  name: "Du lịch",
  pathname: "du-lich",
  category: "Tiếng Anh",
  description: "Từ vựng đi sân bay",
  words: [
    { id: 1, source: "airport", target: "sân bay", phonetic: "/ˈɛɹpɔɹt/", example: "Where is the airport?", mnemonic: "air + port", image: "https://example.com/a.png" },
    { id: 2, source: "ticket", target: "vé", image: "javascript:alert(1)" }
  ]
};

describe("share links", () => {
  test("a deck survives encode -> decode", async () => {
    const decoded = await decodeDeck(await encodeDeck(deck));
    expect(decoded.name).toBe("Du lịch");
    expect(decoded.category).toBe("Tiếng Anh");
    expect(decoded.words).toHaveLength(2);
    expect(decoded.words[0]).toMatchObject({ source: "airport", target: "sân bay", example: "Where is the airport?", mnemonic: "air + port", status: "new" });
  });

  test("only http(s) images are accepted from a shared link", async () => {
    const decoded = await decodeDeck(await encodeDeck(deck));
    expect(decoded.words[0].image).toBe("https://example.com/a.png");
    expect(decoded.words[1].image).toBeUndefined();
  });

  test("rejects garbage", async () => {
    await expect(decodeDeck("x.nonsense")).rejects.toThrow();
    await expect(decodeDeck("j." + Buffer.from("not json").toString("base64"))).rejects.toThrow();
  });
});
