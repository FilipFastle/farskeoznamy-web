// Verejná stránka — prehľad farností, posledné zmeny oznamov.
// Všetok externý obsah (texty z webov farností) sa vykresľuje výlučne
// cez textContent — žiadne innerHTML.

import { DATA_URLS, SITE } from './config.js';
import {
  el, clear, fetchJson, timeAgoSk, formatDateTimeSk, externalLink, safeHttpUrl,
} from './util.js';
import { lastCheckRun } from './github.js';

const NEW_BADGE_HOURS = 48;

function docChip(doc) {
  const isPdf = doc.type === 'pdf';
  const chip = externalLink(doc.url, '', 'chip');
  if (!(chip instanceof HTMLAnchorElement)) return null;
  chip.append(
    el('span', { class: 'ico', 'aria-hidden': 'true', text: isPdf ? '📄' : '🖼️' }),
    el('span', { class: 'lbl', text: doc.label || (isPdf ? 'PDF dokument' : 'Obrázok') }),
  );
  chip.title = doc.changedAt ? `Zmenené ${formatDateTimeSk(doc.changedAt)}` : doc.url;
  return chip;
}

function parishCard(parish, state) {
  const card = el('article', { class: 'parish-card glass glass-pad' });

  const head = el('div', { class: 'head' }, el('h3', { text: parish.name }));
  const changedAt = state && state.changedAt;
  const isNew = changedAt && (Date.now() - new Date(changedAt).getTime()) < NEW_BADGE_HOURS * 3600 * 1000;
  if (state && state.error) {
    head.append(el('span', { class: 'badge badge-err', title: state.error, text: 'Nedostupné' }));
  } else if (isNew) {
    head.append(el('span', { class: 'badge badge-new', text: 'Nové' }));
  }
  card.append(head);

  const metaBits = [];
  if (changedAt) metaBits.push(`Oznamy aktualizované ${timeAgoSk(changedAt)}`);
  else metaBits.push('Čaká na prvú kontrolu');
  card.append(el('p', { class: 'meta', text: metaBits.join(' · ') }));

  if (state && state.excerpt) {
    const ex = el('div', { class: 'excerpt' }, el('span', { text: state.excerpt }));
    const toggle = el('button', {
      class: 'excerpt-toggle', type: 'button', text: 'Zobraziť viac',
      onclick: () => {
        const open = ex.classList.toggle('open');
        toggle.textContent = open ? 'Zobraziť menej' : 'Zobraziť viac';
      },
    });
    card.append(ex, toggle);
  }

  const docs = (state && state.documents) || [];
  if (docs.length) {
    const chips = el('div', { class: 'doc-chips' });
    docs.slice(0, 6).forEach((d) => {
      const chip = docChip(d);
      if (chip) chips.append(chip);
    });
    card.append(chips);
  }

  const actions = el('div', { class: 'card-actions' });
  const main = externalLink(parish.url, 'Oznamy ↗', 'btn btn-primary btn-sm');
  actions.append(main);
  if (parish.homepage && safeHttpUrl(parish.homepage) && parish.homepage !== parish.url) {
    actions.append(externalLink(parish.homepage, 'Webstránka', 'btn btn-sm'));
  }
  card.append(actions);
  return card;
}

function renderTimeline(history, parishesById) {
  const host = document.getElementById('timeline');
  clear(host);
  const entries = (history.entries || []).slice(0, 14);
  if (!entries.length) {
    host.append(el('li', {}, el('span', { class: 'dot', 'aria-hidden': 'true' }),
      el('div', {}, el('div', { class: 'muted', text: 'Zatiaľ žiadne zaznamenané zmeny — história sa začne plniť po prvej automatickej kontrole.' }))));
    return;
  }
  for (const e of entries) {
    const parish = parishesById.get(e.parishId);
    host.append(el('li', {},
      el('span', { class: 'dot', 'aria-hidden': 'true' }),
      el('div', {},
        el('div', {}, el('strong', { text: parish ? parish.name : e.parishId }), ' — ', e.summary || 'zmena oznamov'),
        el('div', { class: 'when', text: formatDateTimeSk(e.at) }),
      ),
    ));
  }
}

async function showLastCheck() {
  const line = document.getElementById('status-line');
  const run = await lastCheckRun();
  if (run && run.at) {
    line.textContent = '';
    line.append(
      el('span', { class: 'ok-dot', 'aria-hidden': 'true' }),
      `${SITE.checkIntervalText} Posledná kontrola: ${formatDateTimeSk(run.at)}.`,
    );
  }
}

async function init() {
  const grid = document.getElementById('parish-grid');
  try {
    const [parishData, statusData, historyData] = await Promise.all([
      fetchJson(DATA_URLS.parishes),
      fetchJson(DATA_URLS.status).catch(() => ({ parishes: {} })),
      fetchJson(DATA_URLS.history).catch(() => ({ entries: [] })),
    ]);

    const parishes = parishData.parishes || [];
    const parishesById = new Map(parishes.map((p) => [p.id, p]));

    clear(grid);
    if (!parishes.length) {
      grid.append(el('p', { class: 'muted', text: 'Zatiaľ nie sú pridané žiadne farnosti.' }));
    }
    for (const parish of parishes) {
      grid.append(parishCard(parish, (statusData.parishes || {})[parish.id]));
    }

    if (statusData.generatedAt) {
      document.getElementById('generated-at').textContent = `Údaje z ${formatDateTimeSk(statusData.generatedAt)}`;
    }
    renderTimeline(historyData, parishesById);
  } catch (err) {
    clear(grid);
    grid.append(el('p', { class: 'muted', text: `Údaje sa nepodarilo načítať (${err.message}).` }));
  }
  showLastCheck();
}

init();
