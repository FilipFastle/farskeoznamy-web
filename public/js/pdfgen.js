// Generátor PDF farských oznamov.
// Predvyplní rozpis týždňa z liturgického kalendára (liturgical.js) a
// predvolených omší farnosti; všetko je možné upraviť. PDF sa skladá
// lokálne v prehliadači cez jsPDF s vloženým fontom DejaVu Sans
// (slovenská diakritika) — žiadne údaje neopúšťajú zariadenie.

import { el, clear, toast } from './util.js';
import {
  getLiturgicalDay, getWeekSummary, fromInput, toInputValue, addDays, formatDateSk,
} from './liturgical.js';

const DAY_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const $ = (id) => document.getElementById(id);

let getParishes = () => [];
let days = []; // model: {iso, dayName, dateShort, title, subtitle, color, isSunday, masses[]}

// ---------------------------------------------------------------------------
// Pomocníci modelu
// ---------------------------------------------------------------------------

function selectedParish() {
  const id = $('gen-parish').value;
  return getParishes().find((p) => p.id === id) || null;
}

function nextSunday(from = new Date()) {
  const base = fromInput(toInputValue(new Date(Date.UTC(
    from.getFullYear(), from.getMonth(), from.getDate(), 12,
  ))));
  const dow = base.getUTCDay();
  return dow === 0 ? base : addDays(base, 7 - dow);
}

function buildDays() {
  const start = fromInput($('gen-start').value) || nextSunday();
  const count = parseInt($('gen-days').value, 10) || 8;
  const parish = selectedParish();
  days = [];
  for (let i = 0; i < count; i++) {
    const lit = getLiturgicalDay(addDays(start, i));
    const defaults = parish && parish.defaultMasses
      ? (parish.defaultMasses[DAY_KEY[lit.date.getUTCDay()]] || [])
      : [];
    days.push({
      iso: lit.iso,
      dayName: lit.dayName,
      dateShort: lit.dateShort,
      dateLabel: lit.dateLabel,
      title: lit.title,
      subtitle: lit.subtitle,
      color: lit.color,
      isSunday: lit.isSunday,
      holyDay: lit.holyDay,
      masses: defaults
        .filter((m) => m.time || m.place || m.intention)
        .map((m) => ({ ...m })),
    });
  }
}

function prefillHeader() {
  const start = fromInput($('gen-start').value) || nextSunday();
  const count = parseInt($('gen-days').value, 10) || 8;
  const summary = getWeekSummary(start, count);
  const parish = selectedParish();
  $('gen-title').value = parish ? (parish.pdfTitle || parish.name) : '';
  $('gen-week-label').value = summary.label || '';
  $('gen-range').value = summary.range || '';
  if (parish) {
    const bits = [parish.address, parish.contact].filter(Boolean);
    $('gen-footer').value = bits.join(' · ');
  }
}

// ---------------------------------------------------------------------------
// Vykreslenie dní
// ---------------------------------------------------------------------------

function massRowEl(day, mass) {
  const time = el('input', { type: 'time', value: mass.time || '' });
  const place = el('input', { type: 'text', class: 'place-input', value: mass.place || '', placeholder: 'kostol / miesto' });
  const intention = el('input', { type: 'text', value: mass.intention || '', placeholder: 'úmysel svätej omše' });
  time.addEventListener('input', () => { mass.time = time.value; });
  place.addEventListener('input', () => { mass.place = place.value; });
  intention.addEventListener('input', () => { mass.intention = intention.value; });
  const row = el('div', { class: 'mass-row' }, time, place, intention,
    el('button', {
      class: 'icon-btn', type: 'button', title: 'Odstrániť omšu', 'aria-label': 'Odstrániť omšu', text: '✕',
      onclick: () => {
        day.masses.splice(day.masses.indexOf(mass), 1);
        row.remove();
      },
    }));
  return row;
}

function renderDays() {
  const host = $('gen-days-host');
  clear(host);
  for (const day of days) {
    const titleInput = el('input', { type: 'text', value: day.title || '' });
    titleInput.addEventListener('input', () => { day.title = titleInput.value; });

    const card = el('div', { class: `day-card${day.isSunday ? ' is-sunday' : ''}` },
      el('div', { class: 'day-head' },
        el('span', { class: 'color-dot', dataset: { c: day.color }, title: `liturgická farba: ${day.color}` }),
        el('span', { class: 'day-date', text: `${day.dayName} ${day.dateShort}` }),
        el('span', { class: 'day-litur' }, titleInput),
        el('button', {
          class: 'icon-btn add pad-pill', type: 'button', title: 'Pridať omšu', text: '+ omša',
          onclick: () => {
            const mass = { time: '', place: '', intention: '' };
            day.masses.push(mass);
            card.append(massRowEl(day, mass));
          },
        }),
      ),
      day.subtitle ? el('div', { class: 'faint subtitle-note', text: day.subtitle }) : null,
    );
    for (const mass of day.masses) card.append(massRowEl(day, mass));
    host.append(card);
  }
}

function prefillAll() {
  prefillHeader();
  buildDays();
  renderDays();
}

// ---------------------------------------------------------------------------
// Koncepty (localStorage)
// ---------------------------------------------------------------------------

function draftKey() {
  return `fo_draft_${$('gen-parish').value || 'vlastne'}`;
}

function collectModel() {
  return {
    parishId: $('gen-parish').value,
    start: $('gen-start').value,
    count: $('gen-days').value,
    title: $('gen-title').value,
    weekLabel: $('gen-week-label').value,
    range: $('gen-range').value,
    footer: $('gen-footer').value,
    announcements: $('gen-announcements').value,
    days,
  };
}

function applyModel(model) {
  $('gen-start').value = model.start || $('gen-start').value;
  $('gen-days').value = model.count || '8';
  $('gen-title').value = model.title || '';
  $('gen-week-label').value = model.weekLabel || '';
  $('gen-range').value = model.range || '';
  $('gen-footer').value = model.footer || '';
  $('gen-announcements').value = model.announcements || '';
  days = (model.days || []).map((d) => ({ ...d, masses: (d.masses || []).map((m) => ({ ...m })) }));
  renderDays();
}

// ---------------------------------------------------------------------------
// PDF (buildPdf je exportované kvôli testom v Node)
// ---------------------------------------------------------------------------

let pdfLibsPromise = null;

function ensurePdfLibs() {
  if (!pdfLibsPromise) {
    pdfLibsPromise = (async () => {
      if (!window.jspdf || !window.jspdf.jsPDF) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'vendor/jspdf.umd.min.js';
          s.onload = resolve;
          s.onerror = () => reject(new Error('jsPDF sa nepodarilo načítať'));
          document.head.append(s);
        });
      }
      const fonts = await import('../fonts/dejavu-sans.js');
      return { jsPDF: window.jspdf.jsPDF, fonts };
    })();
    pdfLibsPromise.catch(() => { pdfLibsPromise = null; });
  }
  return pdfLibsPromise;
}

const PAGE = { w: 210, h: 297, margin: 14, bottom: 272 };
const COL_LEFT_W = 60;
const GOLD = [167, 134, 56];
const INK = [25, 28, 36];
const MUTED = [95, 100, 115];
const LINE = [205, 200, 185];

export function buildPdf(jsPDF, fonts, model) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  doc.addFileToVFS('DejaVuSans.ttf', fonts.DEJAVU_SANS_NORMAL);
  doc.addFont('DejaVuSans.ttf', 'DejaVu', 'normal');
  doc.addFileToVFS('DejaVuSans-Bold.ttf', fonts.DEJAVU_SANS_BOLD);
  doc.addFont('DejaVuSans-Bold.ttf', 'DejaVu', 'bold');

  const contentW = PAGE.w - 2 * PAGE.margin;
  let y = 18;

  const setFont = (style, size, color = INK) => {
    doc.setFont('DejaVu', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  const ensureSpace = (need) => {
    if (y + need > PAGE.bottom) {
      doc.addPage();
      y = 18;
    }
  };

  // Hlavička
  if (model.title) {
    setFont('normal', 11, MUTED);
    doc.text(model.title, PAGE.w / 2, y, { align: 'center' });
    y += 8;
  }
  setFont('bold', 19);
  doc.text('FARSKÉ OZNAMY', PAGE.w / 2, y, { align: 'center' });
  y += 8;
  const sub = [model.weekLabel, model.range].filter(Boolean).join('  ·  ');
  if (sub) {
    setFont('normal', 11.5, INK);
    doc.text(sub, PAGE.w / 2, y, { align: 'center' });
    y += 6;
  }
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.7);
  doc.line(PAGE.margin, y, PAGE.w - PAGE.margin, y);
  y += 5;

  // Rozpis dní
  const rightX = PAGE.margin + COL_LEFT_W + 4;
  const rightW = contentW - COL_LEFT_W - 4;

  for (const day of model.days) {
    setFont('normal', 8.6, MUTED);
    const litLines = doc.splitTextToSize(
      [day.title, day.subtitle ? `(${day.subtitle})` : ''].filter(Boolean).join(' '), COL_LEFT_W,
    );
    const massBlocks = (day.masses || [])
      .filter((m) => m.time || m.place || m.intention)
      .map((m) => {
        const text = [m.place, m.intention].filter(Boolean).join(' — ');
        setFont('normal', 10);
        const lines = text ? doc.splitTextToSize(text, rightW - 18) : [''];
        return { time: m.time || '', lines };
      });

    const leftH = 4.6 + litLines.length * 3.8 + 1.5;
    const rightH = massBlocks.length
      ? massBlocks.reduce((acc, b) => acc + Math.max(1, b.lines.length) * 4.6, 0) + 1
      : 5;
    const rowH = Math.max(leftH, rightH) + 3.4;

    ensureSpace(rowH);

    if (day.isSunday) {
      doc.setFillColor(250, 243, 224);
      doc.rect(PAGE.margin - 2, y - 1.5, contentW + 4, rowH, 'F');
    }

    let ly = y + 3.4;
    setFont('bold', 10.5);
    doc.text(`${day.dayName} ${day.dateShort}`, PAGE.margin, ly);
    ly += 4.4;
    setFont('normal', 8.6, MUTED);
    for (const line of litLines) {
      doc.text(line, PAGE.margin, ly);
      ly += 3.8;
    }

    let ry = y + 3.4;
    if (!massBlocks.length) {
      setFont('normal', 10, MUTED);
      doc.text('—', rightX, ry);
    }
    for (const block of massBlocks) {
      setFont('bold', 10);
      if (block.time) doc.text(block.time, rightX, ry);
      setFont('normal', 10);
      for (const [i, line] of block.lines.entries()) {
        if (line) doc.text(line, rightX + 16, ry + i * 4.6);
      }
      ry += Math.max(1, block.lines.length) * 4.6;
    }

    y += rowH;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(PAGE.margin, y - 1.2, PAGE.w - PAGE.margin, y - 1.2);
  }

  // Oznamy
  const paragraphs = (model.announcements || '')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);

  if (paragraphs.length) {
    ensureSpace(16);
    y += 6;
    setFont('bold', 12.5);
    doc.text('OZNAMY', PAGE.margin, y);
    y += 2;
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.5);
    doc.line(PAGE.margin, y, PAGE.margin + 24, y);
    y += 5.4;

    paragraphs.forEach((p, idx) => {
      setFont('normal', 10.3);
      const lines = doc.splitTextToSize(p, contentW - 8);
      ensureSpace(lines.length * 4.7 + 2.4);
      setFont('bold', 10.3);
      doc.text(`${idx + 1}.`, PAGE.margin, y);
      setFont('normal', 10.3);
      doc.text(lines, PAGE.margin + 8, y);
      y += lines.length * 4.7 + 2.4;
    });
  }

  // Pätička na každej strane
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(PAGE.margin, 282, PAGE.w - PAGE.margin, 282);
    setFont('normal', 8.4, MUTED);
    if (model.footer) doc.text(model.footer, PAGE.w / 2, 287, { align: 'center' });
    doc.text(`${model.weekLabel || 'Farské oznamy'}${pages > 1 ? `  ·  strana ${p}/${pages}` : ''}`,
      PAGE.w / 2, model.footer ? 291.5 : 287.5, { align: 'center' });
  }

  return doc;
}

async function downloadPdf() {
  const btn = $('gen-pdf');
  btn.disabled = true;
  btn.textContent = 'Pripravujem PDF…';
  try {
    const { jsPDF, fonts } = await ensurePdfLibs();
    const model = collectModel();
    if (!model.days.length) {
      toast('Najprv predvyplňte kalendár.', 'err');
      return;
    }
    const doc = buildPdf(jsPDF, fonts, model);
    const name = `farske-oznamy-${model.parishId || 'farnost'}-${model.start || 'tyzden'}.pdf`;
    doc.save(name);
    toast('PDF stiahnuté ✓', 'ok');
  } catch (err) {
    toast(`PDF sa nepodarilo vytvoriť: ${err.message}`, 'err');
  } finally {
    btn.disabled = false;
    btn.textContent = '⬇ Stiahnuť PDF';
  }
}

// ---------------------------------------------------------------------------
// Inicializácia záložky
// ---------------------------------------------------------------------------

export function initGenerator(parishProvider) {
  getParishes = parishProvider;

  const select = $('gen-parish');
  clear(select);
  for (const parish of getParishes()) {
    select.append(el('option', { value: parish.id, text: parish.name }));
  }
  select.append(el('option', { value: '', text: 'Vlastná hlavička (bez farnosti)' }));

  $('gen-start').value = toInputValue(nextSunday());

  select.addEventListener('change', prefillAll);
  $('gen-start').addEventListener('change', prefillAll);
  $('gen-days').addEventListener('change', prefillAll);
  $('gen-prefill').addEventListener('click', () => {
    prefillAll();
    toast('Kalendár predvyplnený podľa liturgického kalendára.', 'ok');
  });

  $('gen-pdf').addEventListener('click', downloadPdf);

  $('gen-save-draft').addEventListener('click', () => {
    localStorage.setItem(draftKey(), JSON.stringify(collectModel()));
    toast('Rozpracované oznamy uložené (v tomto prehliadači).', 'ok');
  });

  $('gen-load-draft').addEventListener('click', () => {
    const raw = localStorage.getItem(draftKey());
    if (!raw) {
      toast('Pre túto farnosť nie je uložený žiadny koncept.', 'err');
      return;
    }
    try {
      applyModel(JSON.parse(raw));
      toast('Koncept načítaný.', 'ok');
    } catch {
      toast('Koncept sa nepodarilo prečítať.', 'err');
    }
  });

  $('gen-clear').addEventListener('click', () => {
    if (confirm('Vyčistiť celý formulár a nanovo predvyplniť z kalendára?')) {
      $('gen-announcements').value = '';
      prefillAll();
    }
  });

  prefillAll();
}
