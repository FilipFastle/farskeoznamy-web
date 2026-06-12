#!/usr/bin/env node
// Vygeneruje nové prihlasovacie údaje pre public/js/config.js.
// Použitie:  node scripts/hash-password.mjs "NoveSilneHeslo"
// Výstup vložte do AUTH v public/js/config.js (saltHex, hashHex, vaultSaltHex).

import { pbkdf2Sync, randomBytes } from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Použitie: node scripts/hash-password.mjs "NoveHeslo"');
  process.exit(1);
}
if (password.length < 10) {
  console.error('Heslo musí mať aspoň 10 znakov.');
  process.exit(1);
}

const iterations = 600000;
const salt = randomBytes(16);
const vaultSalt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, iterations, 32, 'sha256');

console.log('Vložte do AUTH v public/js/config.js:\n');
console.log(`  iterations: ${iterations},`);
console.log(`  saltHex: '${salt.toString('hex')}',`);
console.log(`  hashHex: '${hash.toString('hex')}',`);
console.log(`  vaultSaltHex: '${vaultSalt.toString('hex')}',`);
console.log('\nPo zmene vaultSaltHex bude potrebné v správe znova uložiť GitHub token.');
