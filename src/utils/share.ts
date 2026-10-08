import { CollectionItem, WordItem } from "types";

// Share a collection as a link: the deck is packed into the URL hash (never sent to a server).
// Format: gzip (when available) + base64url of compact JSON, prefixed "z." or "j.".

interface SharedDeck {
  n: string; // name
  c?: string; // category
  d?: string; // description
  w: [string, string, string, string, string, string][]; // source, target, phonetic, example, mnemonic, image
}

const toBase64Url = (bytes: Uint8Array): string => {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (s: string): Uint8Array => {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

// CompressionStream isn't in the TS 4.x DOM typings, so reach it through globalThis
const streams = globalThis as any;

async function pipe(bytes: Uint8Array, stream: any): Promise<Uint8Array> {
  const out = new Response((new Blob([bytes as BlobPart]).stream() as any).pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

export async function encodeDeck(collection: CollectionItem): Promise<string> {
  const deck: SharedDeck = {
    n: collection.name,
    c: collection.category,
    d: collection.description,
    w: collection.words.map((w) => [w.source, w.target, w.phonetic || "", w.example || "", w.mnemonic || "", w.image || ""])
  };
  const raw = new TextEncoder().encode(JSON.stringify(deck));
  if (typeof streams.CompressionStream !== "undefined") {
    return "z." + toBase64Url(await pipe(raw, new streams.CompressionStream("gzip")));
  }
  return "j." + toBase64Url(raw);
}

export interface DecodedDeck {
  name: string;
  category?: string;
  description?: string;
  words: Omit<WordItem, "id">[];
}

export async function decodeDeck(payload: string): Promise<DecodedDeck> {
  const kind = payload.slice(0, 2);
  const bytes = fromBase64Url(payload.slice(2));
  let json: Uint8Array;
  if (kind === "z.") {
    if (typeof streams.DecompressionStream === "undefined") throw new Error("Trình duyệt không hỗ trợ giải nén liên kết này");
    json = await pipe(bytes, new streams.DecompressionStream("gzip"));
  } else if (kind === "j.") {
    json = bytes;
  } else {
    throw new Error("Liên kết chia sẻ không hợp lệ");
  }

  const deck = JSON.parse(new TextDecoder().decode(json)) as SharedDeck;
  if (!deck || typeof deck.n !== "string" || !Array.isArray(deck.w)) throw new Error("Dữ liệu chia sẻ không hợp lệ");

  return {
    name: deck.n,
    category: deck.c,
    description: deck.d,
    words: deck.w
      .filter((r) => Array.isArray(r) && r[0] && r[1])
      .map((r) => ({
        source: String(r[0]),
        target: String(r[1]),
        phonetic: r[2] || undefined,
        example: r[3] || undefined,
        mnemonic: r[4] || undefined,
        // Only plain web images are accepted from shared links
        image: /^https?:\/\//i.test(r[5] || "") ? r[5] : undefined,
        status: "new" as const,
        starred: false,
        reviewCount: 0
      }))
  };
}

export async function buildShareUrl(collection: CollectionItem): Promise<string> {
  const payload = await encodeDeck(collection);
  const base = window.location.href.split("#")[0].replace(/\/(collections|review|stats|apps|share).*$/, "");
  return `${base}/share#d=${payload}`;
}
