// Prihlasovanie a ochrana správcovskej časti.
//
// Ako to funguje:
//  - Heslo sa overuje cez PBKDF2-SHA-256 (600 000 iterácií) proti uloženému
//    odtlačku — samotné heslo sa nikde neukladá ani neposiela.
//  - Po prihlásení sa vytvorí relácia v sessionStorage s časovým limitom
//    (automatické odhlásenie po nečinnosti).
//  - Opakované zlé pokusy spúšťajú narastajúce oneskorenie (spomalenie
//    slovníkových útokov v prehliadači).
//  - GitHub token (PAT) sa ukladá ZAŠIFROVANÝ (AES-GCM 256) kľúčom
//    odvodeným z hesla — bez prihlásenia ho nemožno prečítať.
//
// Úprimná poznámka k bezpečnosti: statická stránka nemá server, preto je
// toto ochrana rozhrania a uložených tajomstiev, nie serverové overenie.
// Všetky údaje farností sú verejné JSON súbory. Skutočnú serverovú ochranu
// admin stránky doplníte zadarmo cez Cloudflare Access (návod v README).

import { AUTH } from './config.js';
import { bytesToHex, hexToBytes } from './util.js';

const SESSION_KEY = 'fo_session_v1';
const VAULT_KEY_KEY = 'fo_vault_key_v1';   // sessionStorage — zanikne so zatvorením karty
const LOCK_KEY = 'fo_lock_v1';             // localStorage — počítadlo zlých pokusov
const PAT_KEY = 'fo_pat_v1';               // localStorage — zašifrovaný token

const enc = new TextEncoder();

async function pbkdf2(password, saltHex, iterations, bits) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'],
  );
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: hexToBytes(saltHex), iterations },
    keyMaterial, bits,
  );
}

function constantTimeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// --- Brzdenie pokusov -------------------------------------------------------

function getLock() {
  try { return JSON.parse(localStorage.getItem(LOCK_KEY)) || { fails: 0, until: 0 }; }
  catch { return { fails: 0, until: 0 }; }
}

function setLock(lock) {
  localStorage.setItem(LOCK_KEY, JSON.stringify(lock));
}

export function lockRemainingSeconds() {
  const lock = getLock();
  return Math.max(0, Math.ceil((lock.until - Date.now()) / 1000));
}

function registerFailure() {
  const lock = getLock();
  lock.fails += 1;
  if (lock.fails >= 3) {
    const delay = Math.min(15 * 60, 2 ** (lock.fails - 2) * 5); // 5 s → max 15 min
    lock.until = Date.now() + delay * 1000;
  }
  setLock(lock);
}

function clearFailures() {
  localStorage.removeItem(LOCK_KEY);
}

// --- Prihlásenie / relácia --------------------------------------------------

export async function login(username, password) {
  const wait = lockRemainingSeconds();
  if (wait > 0) {
    return { ok: false, error: `Priveľa pokusov. Skúste o ${wait} s.` };
  }
  const hashBuf = await pbkdf2(password, AUTH.saltHex, AUTH.iterations, 256);
  const userOk = username.trim() === AUTH.username;
  const passOk = constantTimeEqualHex(bytesToHex(hashBuf), AUTH.hashHex);
  if (!userOk || !passOk) {
    registerFailure();
    const after = lockRemainingSeconds();
    return {
      ok: false,
      error: after > 0
        ? `Nesprávne meno alebo heslo. Ďalší pokus o ${after} s.`
        : 'Nesprávne meno alebo heslo.',
    };
  }
  clearFailures();
  // Kľúč na (de)šifrovanie tokenu — odvodený z hesla, drží sa len v karte.
  const vaultBits = await pbkdf2(password, AUTH.vaultSaltHex, AUTH.iterations, 256);
  sessionStorage.setItem(VAULT_KEY_KEY, bytesToHex(vaultBits));
  touchSession();
  return { ok: true };
}

export function touchSession() {
  const exp = Date.now() + AUTH.sessionMinutes * 60 * 1000;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ exp }));
}

export function isLoggedIn() {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    if (!s || typeof s.exp !== 'number') return false;
    if (Date.now() > s.exp) { logout(); return false; }
    return true;
  } catch { return false; }
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(VAULT_KEY_KEY);
}

// Predĺženie relácie pri aktivite + automatické odhlásenie.
export function watchSession(onExpire) {
  ['click', 'keydown', 'pointermove'].forEach((evt) => {
    document.addEventListener(evt, () => { if (isLoggedIn()) touchSession(); }, { passive: true });
  });
  setInterval(() => {
    if (!isLoggedIn()) onExpire();
  }, 30 * 1000);
}

// --- Šifrovaný trezor pre GitHub token ---------------------------------------

async function vaultCryptoKey() {
  const hex = sessionStorage.getItem(VAULT_KEY_KEY);
  if (!hex) throw new Error('Relácia bez kľúča — prihláste sa znova.');
  return crypto.subtle.importKey('raw', hexToBytes(hex), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function storeToken(token) {
  if (!token) { localStorage.removeItem(PAT_KEY); return; }
  const key = await vaultCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(token));
  localStorage.setItem(PAT_KEY, JSON.stringify({ iv: bytesToHex(iv), ct: bytesToHex(ct) }));
}

export function hasStoredToken() {
  return !!localStorage.getItem(PAT_KEY);
}

export async function readToken() {
  const raw = localStorage.getItem(PAT_KEY);
  if (!raw) return null;
  try {
    const { iv, ct } = JSON.parse(raw);
    const key = await vaultCryptoKey();
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: hexToBytes(iv) }, key, hexToBytes(ct),
    );
    return new TextDecoder().decode(pt);
  } catch {
    return null;
  }
}

export function forgetToken() {
  localStorage.removeItem(PAT_KEY);
}
