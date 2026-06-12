// Pomocné funkcie — bezpečná práca s DOM-om a formátovanie.
// Externý obsah sa NIKDY nevkladá cez innerHTML; všetok text ide cez
// textContent, aby stránku nebolo možné napadnúť cez obsah sledovaných webov.

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2), value);
    } else node.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

// Povolené sú len odkazy http(s) — ochrana pred javascript:/data: URL.
export function safeHttpUrl(value) {
  try {
    const u = new URL(String(value));
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
  } catch { /* neplatná URL */ }
  return null;
}

export function externalLink(href, label, cls = '') {
  const safe = safeHttpUrl(href);
  if (!safe) return el('span', { class: cls, text: label });
  return el('a', {
    href: safe, class: cls, target: '_blank', rel: 'noopener noreferrer', text: label,
  });
}

export function timeAgoSk(iso) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 90) return 'pred chvíľou';
  const m = Math.floor(s / 60);
  if (m < 60) return `pred ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return h === 1 ? 'pred hodinou' : `pred ${h} hod.`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'včera';
  if (d < 30) return `pred ${d} dňami`;
  const mo = Math.floor(d / 30);
  return mo === 1 ? 'pred mesiacom' : `pred ${mo} mesiacmi`;
}

export function formatDateTimeSk(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('sk-SK', {
    day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status} pri načítaní ${url}`);
  return res.json();
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'farnost';
}

export function toast(message, kind = 'info') {
  let host = document.querySelector('.toast-host');
  if (!host) {
    host = el('div', { class: 'toast-host', role: 'status', 'aria-live': 'polite' });
    document.body.append(host);
  }
  const t = el('div', { class: `toast toast-${kind}`, text: message });
  host.append(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 400);
  }, 4200);
}

export function bytesToHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

// Base64 kódovanie UTF-8 reťazca (pre GitHub Contents API).
export function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

export function base64ToUtf8(b64) {
  const bin = atob(b64.replace(/\s+/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
