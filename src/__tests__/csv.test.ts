import { parseDelimited, csvToBulkText, collectionToCsv } from "utils/csv";
import { WordItem } from "types";

describe("parseDelimited", () => {
  test("handles quotes, embedded commas, escaped quotes and newlines", () => {
    const rows = parseDelimited('front,back\n"hello, world","xin ""chào"""\n"multi\nline",x');
    expect(rows).toEqual([
      ["front", "back"],
      ["hello, world", 'xin "chào"'],
      ["multi\nline", "x"]
    ]);
  });

  test("detects tab and semicolon delimiters", () => {
    expect(parseDelimited("a\tb\nc\td")).toEqual([["a", "b"], ["c", "d"]]);
    expect(parseDelimited("a;b\nc;d")).toEqual([["a", "b"], ["c", "d"]]);
  });
});

describe("csvToBulkText", () => {
  test("skips the header row and Anki #comment lines, strips HTML", () => {
    const anki = "#separator:tab\n#html:true\ncat\t<b>mèo</b><br>con vật\tThe cat sat\ndog\tchó";
    expect(csvToBulkText(anki)).toBe("cat\tmèo con vật\tThe cat sat\ndog\tchó");
    expect(csvToBulkText("front,back\nsun,mặt trời")).toBe("sun\tmặt trời");
  });

  test("drops rows with an empty side", () => {
    expect(csvToBulkText("front,back\n,only\nx,")).toBe("");
  });
});

describe("collectionToCsv", () => {
  test("writes a BOM, a header and escaped fields that parse back", () => {
    const words: WordItem[] = [{ id: 1, source: 'say "hi"', target: "chào, bạn", example: "He said\nhi" }];
    const csv = collectionToCsv(words);
    expect(csv.startsWith("﻿")).toBe(true);
    const rows = parseDelimited(csv);
    expect(rows[0][0]).toBe("front");
    expect(rows[1][0]).toBe('say "hi"');
    expect(rows[1][1]).toBe("chào, bạn");
    expect(rows[1][3]).toBe("He said\nhi");
  });
});
