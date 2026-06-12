// Konfigurácia aplikácie Farské oznamy.

// Prihlasovanie do správy — heslo sa NIKDY neukladá v čitateľnej podobe.
// Uložený je len PBKDF2-SHA-256 odtlačok (600 000 iterácií, náhodná soľ).
// Nový odtlačok vygenerujete príkazom: node scripts/hash-password.mjs
export const AUTH = {
  username: 'admin',
  iterations: 600000,
  saltHex: '6c18e6b8ac8fc5f236bd89824a186e8d',
  hashHex: 'b419974b51a55d961cec0396ab02b94f0e639e5b971c913e6d9b5c7dd354b99a',
  // Samostatná soľ pre kľúč, ktorým sa šifruje GitHub token (AES-GCM).
  vaultSaltHex: 'd5b2f3db4d537202143b31e22942a1c5',
  // Automatické odhlásenie po nečinnosti (minúty).
  sessionMinutes: 60,
};

// Repozitár, do ktorého správa farností ukladá zmeny (GitHub Contents API).
export const REPO = {
  owner: 'FilipFastle',
  repo: 'farskeoznamy-web',
  branch: 'main',
  parishesPath: 'public/data/parishes.json',
  checkWorkflow: 'check.yml',
};

export const DATA_URLS = {
  parishes: 'data/parishes.json',
  status: 'data/status.json',
  history: 'data/history.json',
};

export const SITE = {
  title: 'Farské oznamy · Zvolen',
  footer: '© 2026 Filip Stašek',
  checkIntervalText: 'Oznamy sa automaticky kontrolujú každú hodinu.',
};
