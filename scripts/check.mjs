#!/usr/bin/env node
// Kontrola farských oznamov — beží každú hodinu v GitHub Actions.
//
// Pre každú farnosť stiahne stránku s oznamami, vytiahne čitateľný text,
// nájde odkazy na PDF a obrázky, stiahne ich a vypočíta odtlačky (SHA-256).
// Pri zmene odtlačku zapíše nový stav do public/data/status.json a pridá
// záznam do public/data/history.json. Workflow následne commitne zmeny,
// čo spustí nasadenie webu. Žiadne externé závislosti (Node 22+).
//
// Použitie:
//   node scripts/check.mjs [--parishes cesta] [--out adresár]

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import process from 'node:process';

const ROOT = new URL('..', import.meta.url).pathname;

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const PARISHES_FILE = arg('parishes', path.join(ROOT, 'public/data/parishes.json'));
const OUT_DIR = arg('out', path.join(ROOT, 'public/data'));

const USER_AGENT = 'FarskeOznamyBot/1.0 (sledovanie farskych oznamov; kontakt cez GitHub)';
const FETCH_TIMEOUT_MS = 30000;
const MAX_ASSET_BYTES = 20 * 1024 * 1024;
const MAX_DOCS_PER_PARISH = 12;
const EXCERPT_LENGTH = 900;
const HISTORY_LIMIT = 300;

const sha256 = (data) => createHash('sha256').update(data).digest('hex');

// ---------------------------------------------------------------------------
// Sťahovanie
// ---------------------------------------------------------------------------

async function fetchUrl(url, accept) {
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      'User-Agent': USER_AGENT,
      Accept: accept || '*/*',
      'Accept-Language': 'sk,cs;q=0.8,en;q=0.5',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

async function fetchBytes(url) {
  const res = await fetchUrl(url);
  const length = Number(res.headers.get('content-length') || 0);
  if (length > MAX_ASSET_BYTES) throw new Error(`príliš veľký súbor (${length} B)`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_ASSET_BYTES) throw new Error('príliš veľký súbor');
  return buf;
}

// ---------------------------------------------------------------------------
// Extrakcia obsahu z HTML (bez závislostí — regulárne výrazy stačia na
// detekciu zmien; nejde o plnohodnotný parser)
// ---------------------------------------------------------------------------

const ENTITIES = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", hellip: '…',
  ndash: '–', mdash: '—', laquo: '«', raquo: '»', bdquo: '„', ldquo: '“',
  rdquo: '”', lsquo: '‘', rsquo: '’', eacute: 'é', aacute: 'á', iacute: 'í',
  oacute: 'ó', uacute: 'ú', yacute: 'ý', scaron: 'š', ccaron: 'č', zcaron: 'ž',
  tcaron: 'ť', dcaron: 'ď', lcaron: 'ľ', ncaron: 'ň', ocirc: 'ô', racute: 'ŕ',
  lacute: 'ĺ', auml: 'ä', sect: '§', copy: '©', reg: '®', deg: '°', times: '×',
};

function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => safeCodePoint(parseInt(num, 10)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

function safeCodePoint(cp) {
  try { return cp > 31 ? String.fromCodePoint(cp) : ' '; } catch { return ' '; }
}

function stripBlock(html, tag) {
  return html.replace(new RegExp(`<${tag}[\\s\\S]*?</${tag}>`, 'gi'), ' ');
}

function pickRegion(html, parish) {
  let region = html;
  if (parish.startMarker && parish.endMarker) {
    const start = html.indexOf(parish.startMarker);
    const end = start > -1 ? html.indexOf(parish.endMarker, start) : -1;
    if (start > -1 && end > start) return html.slice(start, end);
  }
  const body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html);
  if (body) region = body[1];
  const main = /<main[^>]*>([\s\S]*?)<\/main>/i.exec(region)
    || /<article[^>]*>([\s\S]*?)<\/article>/i.exec(region)
    || /<[a-z]+[^>]+id=["'](?:content|main|obsah)["'][^>]*>([\s\S]*?)<\/(?:div|section|main)>/i.exec(region);
  if (main && main[1].length > 400) region = main[1];
  return region;
}

function extractText(html, parish) {
  let region = pickRegion(html, parish);
  for (const tag of ['script', 'style', 'noscript', 'template', 'svg', 'iframe', 'form',
    'nav', 'header', 'footer', 'aside', 'select']) {
    region = stripBlock(region, tag);
  }
  region = region.replace(/<!--[\s\S]*?-->/g, ' ');
  region = region.replace(/<(?:br|\/p|\/div|\/li|\/h[1-6]|\/tr)[^>]*>/gi, '\n');
  region = region.replace(/<[^>]+>/g, ' ');
  region = decodeEntities(region);
  region = region
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    // Riadky, ktoré sa menia samy od seba (dátum, počítadlá), nezarátavame.
    .filter((line) => line && !/^(dnes je|meniny m[áa]|po[čc]et n[áa]v[šs]tev|cookie)/i.test(line));
  return region.join('\n');
}

function extractTitle(html) {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return m ? decodeEntities(m[1]).replace(/\s+/g, ' ').trim().slice(0, 160) : '';
}

const IMAGE_RE = /\.(?:jpe?g|png|webp|gif)(?:\?[^"'\s]*)?$/i;
const SKIP_ASSET_RE = /(logo|icon|favicon|banner|pozadie|background|header|sprite|avatar|button)/i;

function extractAssets(html, parish, baseUrl) {
  const region = pickRegion(html, parish);
  const found = new Map();
  const attrRe = /(?:href|src)\s*=\s*["']([^"'#]+)["']/gi;
  let match;
  while ((match = attrRe.exec(region)) !== null) {
    let abs;
    try { abs = new URL(decodeEntities(match[1].trim()), baseUrl).href; } catch { continue; }
    if (!/^https?:/i.test(abs)) continue;
    const isPdf = /\.pdf(?:\?[^"'\s]*)?$/i.test(abs);
    const isImage = IMAGE_RE.test(abs);
    if (!isPdf && !isImage) continue;
    if (isImage && SKIP_ASSET_RE.test(abs)) continue;
    if (!found.has(abs)) {
      const label = decodeURIComponent((abs.split('/').pop() || '').split('?')[0]).slice(0, 80);
      found.set(abs, { url: abs, type: isPdf ? 'pdf' : 'image', label });
    }
  }
  const all = [...found.values()];
  const pdfs = all.filter((a) => a.type === 'pdf');
  const images = all.filter((a) => a.type === 'image');
  return [...pdfs, ...images].slice(0, MAX_DOCS_PER_PARISH);
}

// ---------------------------------------------------------------------------
// Kontrola jednej farnosti
// ---------------------------------------------------------------------------

async function checkParish(parish, previous, now) {
  const prev = previous || {};
  const result = {
    ok: true,
    error: null,
    title: prev.title || '',
    textHash: prev.textHash || null,
    fingerprint: prev.fingerprint || null,
    changedAt: prev.changedAt || null,
    firstSeenAt: prev.firstSeenAt || now,
    excerpt: prev.excerpt || '',
    documents: prev.documents || [],
  };
  const changes = [];

  let html;
  try {
    const res = await fetchUrl(parish.url, 'text/html,application/xhtml+xml');
    html = await res.text();
  } catch (err) {
    result.ok = false;
    result.error = `Stránku sa nepodarilo stiahnuť: ${err.message}`;
    if (prev.ok !== false) changes.push({ kind: 'error', summary: 'stránka prestala byť dostupná' });
    return { result, changes };
  }

  const text = extractText(html, parish);
  const textHash = sha256(text);
  result.title = extractTitle(html);
  result.excerpt = text.replace(/\n+/g, ' · ').slice(0, EXCERPT_LENGTH);

  const assets = extractAssets(html, parish, parish.url);
  const prevDocs = new Map((prev.documents || []).map((d) => [d.url, d]));
  const documents = [];
  const docChanges = [];

  for (const asset of assets) {
    const prevDoc = prevDocs.get(asset.url);
    try {
      const bytes = await fetchBytes(asset.url);
      const hash = sha256(bytes);
      const changed = !prevDoc || prevDoc.hash !== hash;
      documents.push({
        ...asset,
        hash,
        bytes: bytes.length,
        changedAt: changed ? now : prevDoc.changedAt || now,
      });
      if (!prevDoc) docChanges.push(`nový dokument: ${asset.label}`);
      else if (prevDoc.hash !== hash) docChanges.push(`zmenený dokument: ${asset.label}`);
    } catch (err) {
      // Dokument sa nepodarilo stiahnuť — ponecháme posledný známy stav.
      if (prevDoc) documents.push(prevDoc);
    }
  }
  for (const [url, doc] of prevDocs) {
    if (!assets.some((a) => a.url === url)) docChanges.push(`odstránený dokument: ${doc.label}`);
  }

  result.documents = documents;
  result.textHash = textHash;
  const fingerprint = sha256(textHash + documents.map((d) => d.hash).sort().join(''));

  if (!prev.fingerprint) {
    result.fingerprint = fingerprint;
    result.changedAt = now;
    changes.push({ kind: 'first', summary: 'začaté sledovanie oznamov' });
  } else if (prev.fingerprint !== fingerprint) {
    result.fingerprint = fingerprint;
    result.changedAt = now;
    const bits = [];
    if (prev.textHash !== textHash) bits.push('aktualizovaný text oznamov');
    bits.push(...docChanges);
    changes.push({ kind: 'update', summary: bits.join('; ') || 'zmena obsahu' });
  } else if (prev.ok === false) {
    changes.push({ kind: 'recovered', summary: 'stránka je opäť dostupná' });
  }

  return { result, changes };
}

// ---------------------------------------------------------------------------
// Hlavný beh
// ---------------------------------------------------------------------------

async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch { return fallback; }
}

function stableStringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function main() {
  const now = new Date().toISOString();
  const parishData = await readJson(PARISHES_FILE, { parishes: [] });
  const statusFile = path.join(OUT_DIR, 'status.json');
  const historyFile = path.join(OUT_DIR, 'history.json');
  const oldStatus = await readJson(statusFile, { generatedAt: null, parishes: {} });
  const history = await readJson(historyFile, { entries: [] });

  const newStatus = { generatedAt: oldStatus.generatedAt, parishes: {} };
  const newEntries = [];
  let anyChange = false;

  const parishes = (parishData.parishes || []).filter((p) => p.checkEnabled !== false);
  console.log(`Kontrolujem ${parishes.length} farností…`);

  for (const parish of parishes) {
    process.stdout.write(`- ${parish.name} … `);
    try {
      const { result, changes } = await checkParish(parish, oldStatus.parishes[parish.id], now);
      newStatus.parishes[parish.id] = result;
      if (changes.length) {
        anyChange = true;
        for (const change of changes) {
          newEntries.push({ at: now, parishId: parish.id, kind: change.kind, summary: change.summary });
        }
        console.log(`ZMENA (${changes.map((c) => c.summary).join('; ')})`);
      } else {
        console.log(result.ok ? 'bez zmeny' : `CHYBA: ${result.error}`);
      }
    } catch (err) {
      // Neočakávaná chyba — zachováme predošlý stav, nech jeden výpadok nezmaže dáta.
      newStatus.parishes[parish.id] = oldStatus.parishes[parish.id]
        || { ok: false, error: String(err.message || err) };
      console.log(`CHYBA: ${err.message}`);
    }
  }

  // Farnosti vyradené zo zoznamu sa do stavu neprenášajú.
  if (anyChange) {
    newStatus.generatedAt = now;
    history.entries = [...newEntries, ...(history.entries || [])].slice(0, HISTORY_LIMIT);
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(statusFile, stableStringify(newStatus), 'utf8');
    await writeFile(historyFile, stableStringify(history), 'utf8');
    console.log('Zapísané zmeny do status.json a history.json.');
  } else {
    // Aj bez obsahovej zmeny zapíšeme stav, ak sa zmenila štruktúra farností.
    const sameShape = JSON.stringify(Object.keys(newStatus.parishes).sort())
      === JSON.stringify(Object.keys(oldStatus.parishes || {}).sort());
    if (!sameShape) {
      newStatus.generatedAt = now;
      await writeFile(statusFile, stableStringify(newStatus), 'utf8');
      console.log('Zosúladená štruktúra status.json so zoznamom farností.');
    } else {
      console.log('Žiadne zmeny.');
    }
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = [
      `### Kontrola farských oznamov — ${now}`,
      '',
      ...parishes.map((p) => {
        const st = newStatus.parishes[p.id];
        const flag = st && st.ok ? '🟢' : '🔴';
        return `- ${flag} **${p.name}** — ${st && st.changedAt ? `posledná zmena ${st.changedAt}` : 'bez záznamu'}${st && st.error ? ` — ${st.error}` : ''}`;
      }),
    ];
    await writeFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`, { flag: 'a' });
  }
}

main().catch((err) => {
  console.error('Kontrola zlyhala:', err);
  process.exitCode = 1;
});
