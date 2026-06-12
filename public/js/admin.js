// Správcovské rozhranie: prihlásenie, správa farností, publikovanie na
// GitHub, stav automatickej kontroly a nastavenia. Generátor PDF je
// v samostatnom module pdfgen.js (načítava sa lenivo).

import { DATA_URLS, REPO, SITE } from './config.js';
import {
  el, clear, fetchJson, toast, slugify, timeAgoSk, formatDateTimeSk, safeHttpUrl,
} from './util.js';
import {
  login, logout, isLoggedIn, watchSession, storeToken, readToken, hasStoredToken, forgetToken,
} from './auth.js';
import { verifyToken, getFile, putFile, lastCheckRun } from './github.js';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_LABELS = {
  mon: 'Pondelok', tue: 'Utorok', wed: 'Streda', thu: 'Štvrtok',
  fri: 'Piatok', sat: 'Sobota', sun: 'Nedeľa',
};

const state = {
  parishes: [],
  serverParishes: '[]',
  dirty: false,
  status: { parishes: {} },
  history: { entries: [] },
  generatorReady: false,
};

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------------------
// Prihlásenie
// ---------------------------------------------------------------------------

function showLogin() {
  $('login-view').hidden = false;
  $('panel-view').hidden = true;
  $('login-user').focus();
}

async function showPanel() {
  $('login-view').hidden = true;
  $('panel-view').hidden = false;
  await loadData();
  renderParishList();
  renderStatusTab();
  renderSettings();
}

$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('login-submit');
  const errEl = $('login-error');
  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Overujem…';
  try {
    const result = await login($('login-user').value, $('login-pass').value);
    if (result.ok) {
      $('login-pass').value = '';
      await showPanel();
    } else {
      errEl.textContent = result.error;
    }
  } catch (err) {
    errEl.textContent = `Chyba prihlásenia: ${err.message}`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Prihlásiť sa';
  }
});

$('logout-btn').addEventListener('click', () => {
  logout();
  location.reload();
});

watchSession(() => {
  if (!$('panel-view').hidden) {
    toast('Relácia vypršala — prihláste sa znova.', 'err');
    showLogin();
  }
});

// ---------------------------------------------------------------------------
// Záložky
// ---------------------------------------------------------------------------

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', async () => {
    document.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
    document.querySelectorAll('[role="tabpanel"]').forEach((p) => { p.hidden = true; });
    const panel = $(`tab-${tab.dataset.tab}`);
    panel.hidden = false;
    if (tab.dataset.tab === 'generator' && !state.generatorReady) {
      state.generatorReady = true;
      const { initGenerator } = await import('./pdfgen.js');
      initGenerator(() => state.parishes);
    }
    if (tab.dataset.tab === 'status') renderStatusTab();
  });
});

// ---------------------------------------------------------------------------
// Dáta
// ---------------------------------------------------------------------------

async function loadData() {
  try {
    const data = await fetchJson(DATA_URLS.parishes);
    state.parishes = data.parishes || [];
    state.serverParishes = JSON.stringify(state.parishes);
  } catch (err) {
    toast(`Zoznam farností sa nepodarilo načítať: ${err.message}`, 'err');
    state.parishes = [];
  }
  state.status = await fetchJson(DATA_URLS.status).catch(() => ({ parishes: {} }));
  state.history = await fetchJson(DATA_URLS.history).catch(() => ({ entries: [] }));
}

function markDirty() {
  state.dirty = JSON.stringify(state.parishes) !== state.serverParishes;
  $('publish-parishes').disabled = !state.dirty;
  $('discard-parishes').disabled = !state.dirty;
  $('publish-note').hidden = !state.dirty;
}

// ---------------------------------------------------------------------------
// Zoznam farností
// ---------------------------------------------------------------------------

function renderParishList() {
  const host = $('parish-admin-list');
  clear(host);
  if (!state.parishes.length) {
    host.append(el('p', { class: 'muted', text: 'Žiadne farnosti — pridajte prvú tlačidlom vyššie.' }));
  }
  state.parishes.forEach((parish, idx) => {
    const row = el('div', { class: 'admin-row' },
      el('div', { class: 'grow' },
        el('div', { class: 'name', text: parish.name }),
        el('div', { class: 'url', text: parish.url }),
      ),
      parish.checkEnabled === false
        ? el('span', { class: 'badge badge-err', text: 'Kontrola vypnutá' })
        : el('span', { class: 'badge badge-ok', text: 'Sleduje sa' }),
      el('div', { class: 'row-actions' },
        el('button', {
          class: 'btn btn-sm', type: 'button', title: 'Posunúť vyššie', text: '↑',
          onclick: () => moveParish(idx, -1),
        }),
        el('button', {
          class: 'btn btn-sm', type: 'button', title: 'Posunúť nižšie', text: '↓',
          onclick: () => moveParish(idx, +1),
        }),
        el('button', {
          class: 'btn btn-sm', type: 'button', text: 'Upraviť',
          onclick: () => openParishEditor(parish, idx),
        }),
        el('button', {
          class: 'btn btn-sm btn-danger', type: 'button', text: 'Odstrániť',
          onclick: () => {
            if (confirm(`Naozaj odstrániť farnosť „${parish.name}"? Zmena sa prejaví po publikovaní.`)) {
              state.parishes.splice(idx, 1);
              renderParishList();
              markDirty();
            }
          },
        }),
      ),
    );
    host.append(row);
  });
}

function moveParish(idx, dir) {
  const target = idx + dir;
  if (target < 0 || target >= state.parishes.length) return;
  const [item] = state.parishes.splice(idx, 1);
  state.parishes.splice(target, 0, item);
  renderParishList();
  markDirty();
}

function emptyMasses() {
  const masses = {};
  for (const key of DAY_KEYS) masses[key] = [];
  return masses;
}

function openParishEditor(parish, idx) {
  const isNew = parish === null;
  const data = parish ? JSON.parse(JSON.stringify(parish)) : {
    id: '', name: '', shortName: '', url: '', homepage: '', pdfTitle: '',
    address: '', contact: '', churches: [], defaultMasses: emptyMasses(), checkEnabled: true,
  };
  if (!data.defaultMasses) data.defaultMasses = emptyMasses();

  const dialog = el('dialog', { class: 'glass-dialog' });

  const fName = el('input', { type: 'text', value: data.name, required: 'required' });
  const fUrl = el('input', { type: 'url', value: data.url, placeholder: 'https://…' });
  const fHomepage = el('input', { type: 'url', value: data.homepage || '', placeholder: 'https://…' });
  const fShort = el('input', { type: 'text', value: data.shortName || '' });
  const fPdfTitle = el('input', { type: 'text', value: data.pdfTitle || '', placeholder: 'Hlavička v generovanom PDF' });
  const fAddress = el('input', { type: 'text', value: data.address || '' });
  const fContact = el('input', { type: 'text', value: data.contact || '', placeholder: 'tel., e-mail — pätička PDF' });
  const fChurches = el('textarea', { rows: 2, placeholder: 'Každý kostol na samostatný riadok' });
  fChurches.value = (data.churches || []).join('\n');
  const fEnabled = el('input', { type: 'checkbox' });
  fEnabled.checked = data.checkEnabled !== false;

  const massHost = el('div');

  function massRow(dayKey, mass) {
    const time = el('input', { type: 'time', value: mass.time || '' });
    const place = el('input', { type: 'text', class: 'place-input', value: mass.place || '', placeholder: 'kostol / miesto' });
    const intention = el('input', { type: 'text', value: mass.intention || '', placeholder: 'úmysel (voliteľné)' });
    const row = el('div', { class: 'mass-row' }, time, place, intention,
      el('button', {
        class: 'icon-btn', type: 'button', title: 'Odstrániť omšu', 'aria-label': 'Odstrániť omšu', text: '✕',
        onclick: () => row.remove(),
      }));
    row.dataset.day = dayKey;
    return row;
  }

  function renderMassEditor() {
    clear(massHost);
    for (const key of ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']) {
      const dayBox = el('div', { class: 'day-card' },
        el('div', { class: 'day-head' },
          el('span', { class: 'day-date', text: DAY_LABELS[key] }),
          el('button', {
            class: 'icon-btn add pad-sm', type: 'button', title: 'Pridať omšu', text: '+',
            onclick: (e) => {
              e.target.closest('.day-card').append(massRow(key, {}));
            },
          }),
        ),
      );
      for (const mass of data.defaultMasses[key] || []) {
        if (mass.time || mass.place || mass.intention) dayBox.append(massRow(key, mass));
      }
      massHost.append(dayBox);
    }
  }
  renderMassEditor();

  const form = el('form', { method: 'dialog' },
    el('h2', { text: isNew ? 'Nová farnosť' : `Úprava — ${data.name}` }),
    el('div', { class: 'field' }, el('label', { text: 'Názov farnosti *' }), fName),
    el('div', { class: 'field' }, el('label', { text: 'Adresa stránky s oznamami (sleduje sa) *' }), fUrl),
    el('div', { class: 'field' }, el('label', { text: 'Domovská stránka' }), fHomepage),
    el('div', { class: 'field' }, el('label', { text: 'Krátky názov' }), fShort),
    el('div', { class: 'field' }, el('label', { text: 'Hlavička PDF oznamov' }), fPdfTitle),
    el('div', { class: 'field' }, el('label', { text: 'Adresa (PDF)' }), fAddress),
    el('div', { class: 'field' }, el('label', { text: 'Kontakt (PDF pätička)' }), fContact),
    el('div', { class: 'field' }, el('label', { text: 'Kostoly' }), fChurches),
    el('div', { class: 'field checkbox-row' }, fEnabled, el('label', { text: 'Automaticky kontrolovať zmeny oznamov' })),
    el('h3', { text: 'Predvolené sväté omše (predvyplnia sa v generátore)' }),
    massHost,
    el('div', { class: 'card-actions mt-4' },
      el('button', { class: 'btn btn-primary', type: 'submit', value: 'save', text: isNew ? 'Pridať farnosť' : 'Uložiť úpravy' }),
      el('button', { class: 'btn', type: 'button', text: 'Zrušiť', onclick: () => dialog.close('cancel') }),
    ),
  );

  form.addEventListener('submit', (e) => {
    const url = safeHttpUrl(fUrl.value.trim());
    if (!fName.value.trim() || !url) {
      e.preventDefault();
      toast('Vyplňte názov a platnú adresu (http/https).', 'err');
      return;
    }
    data.name = fName.value.trim();
    data.url = url;
    data.homepage = safeHttpUrl(fHomepage.value.trim()) || '';
    data.shortName = fShort.value.trim() || data.name;
    data.pdfTitle = fPdfTitle.value.trim() || data.name;
    data.address = fAddress.value.trim();
    data.contact = fContact.value.trim();
    data.churches = fChurches.value.split('\n').map((s) => s.trim()).filter(Boolean);
    data.checkEnabled = fEnabled.checked;
    if (!data.id) {
      let base = slugify(data.shortName || data.name);
      let candidate = base; let i = 2;
      while (state.parishes.some((p) => p.id === candidate)) candidate = `${base}-${i++}`;
      data.id = candidate;
    }
    const masses = emptyMasses();
    massHost.querySelectorAll('.mass-row').forEach((row) => {
      const [time, place, intention] = row.querySelectorAll('input');
      if (time.value || place.value || intention.value) {
        masses[row.dataset.day].push({
          time: time.value, place: place.value.trim(), intention: intention.value.trim(),
        });
      }
    });
    data.defaultMasses = masses;

    if (isNew) state.parishes.push(data);
    else state.parishes[idx] = data;
    renderParishList();
    markDirty();
    toast(isNew ? 'Farnosť pridaná — nezabudnite publikovať.' : 'Úpravy uložené — nezabudnite publikovať.', 'ok');
  });

  dialog.append(form);
  dialog.addEventListener('close', () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
}

$('add-parish').addEventListener('click', () => openParishEditor(null, -1));

$('discard-parishes').addEventListener('click', async () => {
  await loadData();
  renderParishList();
  markDirty();
  toast('Zmeny zahodené.', 'info');
});

$('export-parishes').addEventListener('click', () => {
  const blob = new Blob(
    [JSON.stringify({ updatedAt: new Date().toISOString(), parishes: state.parishes }, null, 2)],
    { type: 'application/json' },
  );
  const a = el('a', { href: URL.createObjectURL(blob), download: 'parishes.json' });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
});

function currentBranch() {
  return localStorage.getItem('fo_branch_v1') || REPO.branch;
}

$('publish-parishes').addEventListener('click', async () => {
  const btn = $('publish-parishes');
  const token = await readToken();
  if (!token) {
    toast('Najprv uložte GitHub token v Nastaveniach. Zatiaľ môžete použiť Export JSON.', 'err');
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Publikujem…';
  try {
    const branch = currentBranch();
    let sha;
    try {
      ({ sha } = await getFile(token, REPO.parishesPath, branch));
    } catch {
      sha = undefined; // súbor ešte neexistuje
    }
    const body = `${JSON.stringify({ updatedAt: new Date().toISOString(), parishes: state.parishes }, null, 2)}\n`;
    await putFile(token, REPO.parishesPath, branch, body,
      'Aktualizácia zoznamu farností zo správcovského rozhrania', sha);
    state.serverParishes = JSON.stringify(state.parishes);
    markDirty();
    toast('Publikované ✓ — web sa nasadí automaticky do pár minút.', 'ok');
  } catch (err) {
    toast(`Publikovanie zlyhalo: ${err.message}`, 'err');
  } finally {
    btn.textContent = 'Publikovať na GitHub';
    markDirty();
  }
});

// ---------------------------------------------------------------------------
// Stav kontroly
// ---------------------------------------------------------------------------

async function renderStatusTab() {
  const kv = $('status-kv');
  clear(kv);
  const add = (k, v) => kv.append(el('dt', { text: k }), el('dd', {}, v));
  add('Interval kontroly', 'každú hodinu (GitHub Actions, cron)');
  add('Posledná zmena údajov', state.status.generatedAt ? formatDateTimeSk(state.status.generatedAt) : 'zatiaľ žiadna');
  const run = await lastCheckRun();
  add('Posledný beh kontroly', run
    ? `${formatDateTimeSk(run.at)} (${run.conclusion === 'success' ? 'úspešný' : run.conclusion})`
    : 'nepodarilo sa zistiť (súkromný repozitár alebo limit API)');

  const list = $('status-list');
  clear(list);
  for (const parish of state.parishes) {
    const st = (state.status.parishes || {})[parish.id];
    const row = el('div', { class: 'admin-row' },
      el('div', { class: 'grow' },
        el('div', { class: 'name', text: parish.name }),
        el('div', { class: 'url', text: st && st.changedAt ? `posledná zmena ${timeAgoSk(st.changedAt)}` : 'čaká na prvú kontrolu' }),
      ),
      st && st.error
        ? el('span', { class: 'badge badge-err', title: st.error, text: 'Chyba' })
        : el('span', { class: 'badge badge-ok', text: st ? 'OK' : '—' }),
      el('span', { class: 'faint', text: st && st.documents ? `${st.documents.length} dok.` : '' }),
    );
    list.append(row);
  }
  if (!state.parishes.length) list.append(el('p', { class: 'muted', text: 'Žiadne farnosti.' }));
}

// ---------------------------------------------------------------------------
// Nastavenia
// ---------------------------------------------------------------------------

function renderSettings() {
  $('setting-branch').value = currentBranch();
  $('token-state').textContent = hasStoredToken()
    ? 'Token je uložený (zašifrovaný).'
    : 'Token nie je uložený — publikovanie nie je možné, export JSON funguje vždy.';
}

$('save-token').addEventListener('click', async () => {
  const tokenInput = $('setting-token');
  const branch = $('setting-branch').value.trim() || REPO.branch;
  localStorage.setItem('fo_branch_v1', branch);
  const token = tokenInput.value.trim();
  if (!token) {
    toast('Vložte token, alebo použite „Zabudnúť token".', 'err');
    return;
  }
  try {
    const info = await verifyToken(token);
    if (!info.permissions.push) {
      toast('Token nemá právo zápisu (Contents: Write).', 'err');
      return;
    }
    await storeToken(token);
    tokenInput.value = '';
    renderSettings();
    toast(`Token overený a uložený ✓ (predvolená vetva repozitára: ${info.defaultBranch}).`, 'ok');
  } catch (err) {
    toast(`Overenie zlyhalo: ${err.message}`, 'err');
  }
});

$('forget-token').addEventListener('click', () => {
  forgetToken();
  renderSettings();
  toast('Token odstránený.', 'info');
});

// ---------------------------------------------------------------------------
// Štart
// ---------------------------------------------------------------------------

if (isLoggedIn()) showPanel();
else showLogin();
