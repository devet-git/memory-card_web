import { CollectionItem, WordItem } from "types";

/** Parses CSV/TSV text (RFC 4180 quotes supported). Delimiter is auto-detected from the first line. */
export function parseDelimited(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] || "";
  const delimiter = firstLine.includes("\t") ? "\t" : firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && clean[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

const stripHtml = (s: string) =>
  s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Converts a CSV / Anki "Notes in plain text" export into the tab-separated lines
 * understood by the bulk importer: front \t back \t example.
 * Anki header lines (#separator:tab ...) and a "front,back" header row are skipped.
 */
export function csvToBulkText(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .filter((l) => !l.startsWith("#"))
    .join("\n");
  let rows = parseDelimited(lines);
  if (rows.length > 0 && /^(front|source|term|word|từ|mặt trước)/i.test(rows[0][0].trim()) && rows[0].length > 1) {
    rows = rows.slice(1);
  }
  return rows
    .filter((r) => r.length >= 2 && r[0].trim() && r[1].trim())
    .map((r) => [r[0], r[1], r[2] || ""].map((c) => stripHtml(c).replace(/\t/g, " ")).join("\t").replace(/\t+$/, ""))
    .join("\n");
}

const quote = (v: string | undefined) => `"${(v || "").replace(/"/g, '""')}"`;

/** Collection -> CSV (UTF-8 with BOM-friendly header) importable into Anki/Excel. */
export function collectionToCsv(words: WordItem[]): string {
  const header = ["front", "back", "phonetic", "example", "mnemonic", "image"].join(",");
  const lines = words.map((w) => [w.source, w.target, w.phonetic, w.example, w.mnemonic, w.image].map(quote).join(","));
  return "﻿" + [header, ...lines].join("\r\n");
}

export const safeFileName = (c: CollectionItem) => `memcard-${c.pathname.replace(/[^\w-]+/g, "_")}`;
