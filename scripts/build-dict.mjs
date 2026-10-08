#!/usr/bin/env node
/**
 * Builds the offline dictionary that MemCard uses to suggest words without AI.
 *
 *   node scripts/build-dict.mjs
 *
 * Sources (downloaded once into .dict-cache/):
 *   - WordNet 3.1 (npm: wordnet-db)             definitions, examples, part of speech
 *   - CMU Pronouncing Dictionary (npm)          pronunciation -> converted to IPA
 *   - FrequencyWords en_50k (GitHub)            popularity rank
 * Output (committed): public/dict/<2-letter prefix>.json shards, top.json, meta.json, LICENSES.txt
 * Each shard maps  word -> [ipa, pos, definition, example, rank, lemma]
 */
import { execFileSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const CACHE = join(ROOT, ".dict-cache");
const OUT = join(ROOT, "public", "dict");
const MAX_WORDS = 50000;
const TOP_COUNT = 3000;
const FREQ_URL = "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt";

mkdirSync(CACHE, { recursive: true });

async function download(url, file) {
  if (existsSync(file)) return;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(file));
}

async function fetchNpm(pkg) {
  const dir = join(CACHE, pkg);
  if (existsSync(join(dir, "package"))) return join(dir, "package");
  const meta = await (await fetch(`https://registry.npmjs.org/${pkg}/latest`)).json();
  mkdirSync(dir, { recursive: true });
  const tgz = join(dir, "pkg.tgz");
  await download(meta.dist.tarball, tgz);
  execFileSync("tar", ["-xzf", tgz, "-C", dir]);
  console.log(`  ${pkg}@${meta.version}`);
  return join(dir, "package");
}

// ---------- ARPAbet -> IPA ----------
const VOWELS = {
  AA: "ɑ", AE: "æ", AH: "ʌ", AO: "ɔ", AW: "aʊ", AY: "aɪ", EH: "ɛ", ER: "ɝ", EY: "eɪ",
  IH: "ɪ", IY: "i", OW: "oʊ", OY: "ɔɪ", UH: "ʊ", UW: "u"
};
const CONS = {
  B: "b", CH: "tʃ", D: "d", DH: "ð", F: "f", G: "ɡ", HH: "h", JH: "dʒ", K: "k", L: "l", M: "m",
  N: "n", NG: "ŋ", P: "p", R: "ɹ", S: "s", SH: "ʃ", T: "t", TH: "θ", V: "v", W: "w", Y: "j", Z: "z", ZH: "ʒ"
};
const VALID_ONSETS = new Set([
  "pl", "pr", "bl", "br", "tr", "dr", "kl", "kr", "gl", "gr", "fl", "fr", "θr", "ʃr", "sp", "st", "sk", "sm", "sn", "sl", "sw",
  "tw", "kw", "dw", "gw", "θw", "sf"
]);

function arpaToIpa(arpa) {
  const phones = arpa.split(" ").map((p) => ({ base: p.replace(/\d/, ""), stress: (p.match(/\d/) || [""])[0] }));
  const out = [];
  let cluster = []; // consonants since the last vowel
  const flush = (stress, isVowelNext) => {
    if (!isVowelNext) {
      out.push(...cluster);
      cluster = [];
      return;
    }
    // split the cluster: coda stays with the previous syllable, valid onset goes with the next
    let onsetLen = Math.min(cluster.length, 1);
    if (cluster.length >= 2 && out.length > 0) {
      const last2 = cluster.slice(-2).join("");
      if (VALID_ONSETS.has(last2)) onsetLen = 2;
    } else if (out.length === 0) {
      onsetLen = cluster.length; // word-initial: all consonants are onset
    }
    const coda = cluster.slice(0, cluster.length - onsetLen);
    const onset = cluster.slice(cluster.length - onsetLen);
    out.push(...coda);
    out.push((stress === "1" ? "ˈ" : stress === "2" ? "ˌ" : "") + onset.join(""));
    cluster = [];
  };
  for (const p of phones) {
    if (VOWELS[p.base]) {
      flush(p.stress, true);
      let v = VOWELS[p.base];
      if (p.base === "AH") v = p.stress === "0" ? "ə" : "ʌ";
      if (p.base === "ER") v = p.stress === "0" ? "ɚ" : "ɝ";
      out.push(v);
    } else if (CONS[p.base]) {
      cluster.push(CONS[p.base]);
    }
  }
  flush("", false);
  return out.join("");
}

// ---------- WordNet ----------
const POS_FILES = { n: "noun", v: "verb", a: "adj", r: "adv" };

function parseWordNet(dictDir) {
  const index = {}; // pos -> Map(lemma -> {tag, offset})
  const gloss = {}; // pos -> Map(offset -> gloss)
  for (const [pos, name] of Object.entries(POS_FILES)) {
    index[pos] = new Map();
    for (const line of readFileSync(join(dictDir, `index.${name}`), "utf8").split("\n")) {
      if (!line || line.startsWith("  ")) continue;
      const f = line.split(" ");
      const lemma = f[0];
      if (!/^[a-z]+$/.test(lemma)) continue; // single plain words only
      const pCnt = Number(f[3]);
      const tagsense = Number(f[5 + pCnt]);
      const offset = f[6 + pCnt];
      index[pos].set(lemma, { tag: tagsense, offset });
    }
    gloss[pos] = new Map();
    const dataPos = pos === "a" ? ["adj"] : [name];
    for (const n of dataPos) {
      for (const line of readFileSync(join(dictDir, `data.${n}`), "utf8").split("\n")) {
        if (!line || line.startsWith("  ")) continue;
        const bar = line.indexOf(" | ");
        if (bar < 0) continue;
        gloss[pos].set(line.slice(0, 8), line.slice(bar + 3).trim());
      }
    }
  }
  return { index, gloss };
}

function splitGloss(g) {
  const examples = [...g.matchAll(/"([^"]+)"/g)].map((m) => m[1].trim());
  const def = g.split(/;\s*"/)[0].replace(/;\s*$/, "").trim();
  return { def, examples };
}

const clip = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…");

// ---------- lemmatizer (WordNet morphy rules + irregulars) ----------
const IRREGULAR_VERBS = `be:am,is,are,was,were,been,being;have:has,had,having;do:does,did,done,doing;go:goes,went,gone,going;
say:says,said;make:makes,made;get:gets,got,gotten,getting;know:knows,knew,known;think:thinks,thought;take:takes,took,taken,taking;
see:sees,saw,seen;come:comes,came,coming;give:gives,gave,given,giving;find:finds,found;tell:tells,told;feel:feels,felt;
leave:leaves,left,leaving;put:puts,putting;mean:means,meant;keep:keeps,kept;let:lets,letting;begin:begins,began,begun,beginning;
show:shows,showed,shown;hear:hears,heard;run:runs,ran,running;bring:brings,brought;write:writes,wrote,written,writing;
sit:sits,sat,sitting;stand:stands,stood;lose:loses,lost,losing;pay:pays,paid;meet:meets,met;set:sets,setting;learn:learns,learnt;
lead:leads,led;understand:understands,understood;speak:speaks,spoke,spoken;read:reads;spend:spends,spent;grow:grows,grew,grown;
win:wins,won,winning;buy:buys,bought;send:sends,sent;build:builds,built;fall:falls,fell,fallen;cut:cuts,cutting;
eat:eats,ate,eaten,eating;drive:drives,drove,driven,driving;break:breaks,broke,broken;choose:chooses,chose,chosen;
rise:rises,rose,risen;wear:wears,wore,worn;draw:draws,drew,drawn;sell:sells,sold;fly:flies,flew,flown;throw:throws,threw,thrown;
catch:catches,caught;teach:teaches,taught;forget:forgets,forgot,forgotten;sleep:sleeps,slept;sing:sings,sang,sung;swim:swims,swam,swum;
drink:drinks,drank,drunk;hold:holds,held;hide:hides,hid,hidden;beat:beats,beaten;bite:bites,bit,bitten;blow:blows,blew,blown;
deal:deals,dealt;dig:digs,dug;feed:feeds,fed;fight:fights,fought;hang:hangs,hung;hit:hits,hitting;hurt:hurts;lend:lends,lent;
light:lights,lit;ride:rides,rode,ridden;ring:rings,rang,rung;seek:seeks,sought;shake:shakes,shook,shaken;shoot:shoots,shot;
shut:shuts,shutting;steal:steals,stole,stolen;stick:sticks,stuck;strike:strikes,struck;swear:swears,swore,sworn;tear:tears,tore,torn;
wake:wakes,woke,woken;lie:lies,lay,lain,lying;die:dies,dying;tie:ties,tying;bear:bears,bore,borne;forgive:forgives,forgave,forgiven;
lay:lays,laid;pick:picks;fit:fits,fitted;bend:bends,bent;bet:bets;burn:burns,burnt;dream:dreams,dreamt;spell:spells,spelt;
spill:spills,spilt;spread:spreads;swing:swings,swung;weep:weeps,wept;wind:winds,wound;withdraw:withdraws,withdrew,withdrawn`;
const IRREGULAR_NOUNS = {
  men: "man", women: "woman", children: "child", feet: "foot", teeth: "tooth", mice: "mouse", geese: "goose", people: "person",
  lives: "life", knives: "knife", wives: "wife", leaves: "leaf", wolves: "wolf", halves: "half", selves: "self", shelves: "shelf",
  thieves: "thief", loaves: "loaf", calves: "calf", oxen: "ox", criteria: "criterion", phenomena: "phenomenon", analyses: "analysis",
  crises: "crisis", theses: "thesis", data: "datum", media: "medium", bacteria: "bacterium"
};
const IRREGULAR_ADJ = { better: "good", best: "good", worse: "bad", worst: "bad", less: "little", least: "little", further: "far", furthest: "far", farther: "far", farthest: "far", elder: "old", eldest: "old" };

function buildIrregularMap() {
  const map = new Map();
  for (const part of IRREGULAR_VERBS.replace(/\n/g, "").split(";")) {
    const [base, forms] = part.split(":");
    forms.split(",").forEach((f) => map.set(f.trim(), base.trim()));
  }
  Object.entries(IRREGULAR_NOUNS).forEach(([k, v]) => map.set(k, v));
  Object.entries(IRREGULAR_ADJ).forEach(([k, v]) => map.set(k, v));
  return map;
}

function makeLemmatizer(isWord) {
  const irregular = buildIrregularMap();
  const rules = [
    ["s", ""], ["ses", "s"], ["xes", "x"], ["zes", "z"], ["ches", "ch"], ["shes", "sh"], ["men", "man"], ["ies", "y"],
    ["es", "e"], ["es", ""], ["ed", "e"], ["ed", ""], ["ing", "e"], ["ing", ""], ["er", ""], ["est", ""], ["er", "e"], ["est", "e"]
  ];
  return (word) => {
    if (irregular.has(word) && irregular.get(word) !== word) return irregular.get(word);
    for (const [suffix, repl] of rules) {
      if (!word.endsWith(suffix) || word.length <= suffix.length + 1) continue;
      const stem = word.slice(0, -suffix.length);
      const cand = stem + repl;
      if (cand !== word && isWord(cand)) return cand;
      // doubled consonant: stopped -> stop, running -> run
      if (["ed", "ing", "er", "est"].includes(suffix) && stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2] && isWord(stem.slice(0, -1))) {
        return stem.slice(0, -1);
      }
    }
    return "";
  };
}

// ---------- main ----------
console.log("Downloading sources…");
const wnDir = join(await fetchNpm("wordnet-db"), "dict");
const cmuPkg = await fetchNpm("cmu-pronouncing-dictionary");
await download(FREQ_URL, join(CACHE, "en_50k.txt"));

console.log("Parsing…");
const { dictionary: cmu } = await import(pathToFileURL(join(cmuPkg, "index.js")).href);
const wn = parseWordNet(wnDir);
const wnHas = (w) => Object.values(wn.index).some((m) => m.has(w));

const freq = readFileSync(join(CACHE, "en_50k.txt"), "utf8").split("\n").map((l) => l.split(" ")[0]);
const vocab = [];
const seen = new Set();
for (const w of freq) {
  if (vocab.length >= MAX_WORDS) break;
  if (!/^[a-z]{2,}$/.test(w) || seen.has(w)) continue;
  if (!(w in cmu) && !wnHas(w)) continue;
  seen.add(w);
  vocab.push(w);
}
const isVocab = (w) => seen.has(w);
const lemmatize = makeLemmatizer((w) => isVocab(w) && wnHas(w));

const entries = new Map();
vocab.forEach((w, i) => {
  const ipa = w in cmu ? arpaToIpa(cmu[w]) : "";
  // POS ordered by how often the word is used in that sense
  const senses = Object.keys(POS_FILES)
    .map((pos) => ({ pos, hit: wn.index[pos].get(w) }))
    .filter((s) => s.hit)
    .sort((a, b) => b.hit.tag - a.hit.tag);
  let def = "";
  let ex = "";
  // Prefer a plain definition; senses starting with a "(domain)" label (e.g. "(American football)") come last
  let best = null;
  for (const s of senses) {
    const g = wn.gloss[s.pos].get(s.hit.offset);
    if (!g) continue;
    const parsed = splitGloss(g);
    if (!best) best = parsed;
    if (!parsed.def.startsWith("(")) {
      best = parsed;
      break;
    }
  }
  if (best) {
    def = clip(best.def, 120);
    const withWord = best.examples.find((e) => new RegExp(`\\b${w}`, "i").test(e));
    ex = clip(withWord || "", 100);
  }
  const lemma = lemmatize(w);
  entries.set(w, [ipa, senses.map((s) => s.pos).join(""), def, ex, i + 1, lemma]);
});

// ---------- write shards ----------
console.log("Writing…");
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const shardKey = (w) => (w.length >= 2 ? w.slice(0, 2) : `${w}_`);
const shards = new Map();
for (const [w, e] of entries) {
  const k = shardKey(w);
  if (!shards.has(k)) shards.set(k, {});
  // trailing empty fields are dropped by the reader's defaults to save bytes
  const arr = [...e];
  while (arr.length && (arr[arr.length - 1] === "" || arr[arr.length - 1] == null)) arr.pop();
  shards.get(k)[w] = arr;
}
let rawBytes = 0;
let gzBytes = 0;
for (const [k, data] of shards) {
  const json = JSON.stringify(data);
  writeFileSync(join(OUT, `${k}.json`), json);
  rawBytes += Buffer.byteLength(json);
  gzBytes += gzipSync(json).length;
}
const top = vocab.slice(0, TOP_COUNT).map((w) => [w, ...entries.get(w)]);
writeFileSync(join(OUT, "top.json"), JSON.stringify(top));
writeFileSync(join(OUT, "meta.json"), JSON.stringify({ version: 1, words: vocab.length, shards: [...shards.keys()].sort() }));
writeFileSync(
  join(OUT, "LICENSES.txt"),
  `MemCard offline dictionary — data sources

WordNet 3.1 (definitions, examples, parts of speech)
  Copyright 2011 Princeton University. WordNet is freely usable under the WordNet License:
  https://wordnet.princeton.edu/license-and-commercial-use

CMU Pronouncing Dictionary (pronunciations, converted to IPA)
  Copyright Carnegie Mellon University. Distributed under a BSD-style (ISC) license:
  https://github.com/cmusphinx/cmudict

FrequencyWords (word popularity rank; derived from OpenSubtitles)
  https://github.com/hermitdave/FrequencyWords — Creative Commons CC-BY-SA 4.0

Rebuild with: node scripts/build-dict.mjs
`
);

const files = readdirSync(OUT).length;
console.log(`Done: ${vocab.length} words, ${shards.size} shards (${files} files), ${(rawBytes / 1e6).toFixed(2)} MB raw / ${(gzBytes / 1e6).toFixed(2)} MB gzip`);
console.log("sample:", JSON.stringify(entries.get("went")), JSON.stringify(entries.get("delicious")), JSON.stringify(entries.get("running")));
