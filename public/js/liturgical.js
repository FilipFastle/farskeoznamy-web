// Liturgický kalendár rímskokatolíckej cirkvi (slovenský kalendár).
// Počíta obdobia, týždne, nedele, slávnosti, sviatky a spomienky vrátane
// pohyblivých dátumov odvodených od Veľkej noci. Slúži na predvyplnenie
// generátora farských oznamov — výsledok je vždy možné ručne upraviť.
//
// Modul je čistý JavaScript bez závislostí; všetky dátumy počíta v UTC
// na poludnie, aby sa predišlo posunom pri zmene času.

export const DAYS_SK = ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'];
export const MONTHS_SK_GEN = ['januára', 'februára', 'marca', 'apríla', 'mája', 'júna',
  'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra'];

export const RANKS = {
  TRIDUUM: 7,
  SOLEMNITY: 6,   // slávnosť
  LORD_FEAST: 5,  // sviatok Pána
  SUNDAY: 4,
  FEAST: 3,       // sviatok
  MEMORIAL: 2,    // spomienka
  OPTIONAL: 1,    // ľubovoľná spomienka
  FERIA: 0,
};

const RANK_LABELS = {
  [RANKS.SOLEMNITY]: 'slávnosť',
  [RANKS.LORD_FEAST]: 'sviatok',
  [RANKS.FEAST]: 'sviatok',
  [RANKS.MEMORIAL]: 'spomienka',
  [RANKS.OPTIONAL]: 'ľubovoľná spomienka',
};

export const COLORS = {
  green: 'zelená',
  violet: 'fialová',
  white: 'biela',
  red: 'červená',
  rose: 'ružová',
};

// ---------------------------------------------------------------------------
// Pomocné funkcie s dátumami (UTC poludnie)
// ---------------------------------------------------------------------------

export function utcDate(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export function fromInput(value) {
  const [y, m, d] = String(value).split('-').map(Number);
  if (!y || !m || !d) return null;
  return utcDate(y, m, d);
}

export function addDays(date, n) {
  return new Date(date.getTime() + n * 86400000);
}

export function diffDays(a, b) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

function sameDay(a, b) {
  return a.getUTCFullYear() === b.getUTCFullYear()
    && a.getUTCMonth() === b.getUTCMonth()
    && a.getUTCDate() === b.getUTCDate();
}

function prevOrSameSunday(date) {
  return addDays(date, -date.getUTCDay());
}

export function formatDateSk(date, { withYear = true, genitive = true } = {}) {
  const d = date.getUTCDate();
  const m = date.getUTCMonth();
  const y = date.getUTCFullYear();
  const month = genitive ? MONTHS_SK_GEN[m] : `${m + 1}.`;
  return withYear ? `${d}. ${month} ${y}` : `${d}. ${month}`;
}

export function formatDateNum(date, { withYear = false } = {}) {
  const d = date.getUTCDate();
  const m = date.getUTCMonth() + 1;
  return withYear ? `${d}. ${m}. ${date.getUTCFullYear()}` : `${d}. ${m}.`;
}

export function toInputValue(date) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${p(date.getUTCMonth() + 1)}-${p(date.getUTCDate())}`;
}

// ---------------------------------------------------------------------------
// Veľká noc a kľúčové pohyblivé dátumy
// ---------------------------------------------------------------------------

// Gregoriánsky computus (Meeus/Jones/Butcher).
export function easterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utcDate(year, month, day);
}

// Prvá adventná nedeľa: štvrtá nedeľa pred 25. decembrom.
export function adventStart(year) {
  const dec25 = utcDate(year, 12, 25);
  const dow = dec25.getUTCDay();
  const sundayBefore = addDays(dec25, -(dow === 0 ? 7 : dow));
  return addDays(sundayBefore, -21);
}

// Krst Krista Pána: nedeľa po 6. januári (na Slovensku je Zjavenie Pána 6. 1.).
export function baptismOfTheLord(year) {
  const epiphany = utcDate(year, 1, 6);
  return addDays(epiphany, 7 - (epiphany.getUTCDay() === 0 ? 7 : epiphany.getUTCDay()) || 7);
}

export function keyDates(year) {
  const easter = easterDate(year);
  return {
    easter,
    ashWednesday: addDays(easter, -46),
    palmSunday: addDays(easter, -7),
    holyThursday: addDays(easter, -3),
    goodFriday: addDays(easter, -2),
    holySaturday: addDays(easter, -1),
    divineMercy: addDays(easter, 7),
    ascension: addDays(easter, 39),
    pentecost: addDays(easter, 49),
    maryMotherOfChurch: addDays(easter, 50),
    trinity: addDays(easter, 56),
    corpusChristi: addDays(easter, 60),
    sacredHeart: addDays(easter, 68),
    immaculateHeart: addDays(easter, 69),
    baptism: baptismOfTheLord(year),
    advent1: adventStart(year),
    christKing: addDays(adventStart(year), -7),
    christmas: utcDate(year, 12, 25),
    epiphany: utcDate(year, 1, 6),
    motherOfGod: utcDate(year, 1, 1),
  };
}

// ---------------------------------------------------------------------------
// Pevné slávenia (slovenský liturgický kalendár — výber)
// rank: S = slávnosť, F = sviatok, M = spomienka, O = ľubovoľná spomienka
// color: w biela, r červená, g zelená, v fialová
// holy: prikázaný sviatok na Slovensku
// ---------------------------------------------------------------------------

const F = [
  [1, 1, 'Panny Márie Bohorodičky', 'S', 'w', true],
  [1, 2, 'Sv. Bazila Veľkého a Gregora Nazianzského, biskupov a učiteľov Cirkvi', 'M', 'w'],
  [1, 3, 'Najsvätejšieho mena Ježiš', 'O', 'w'],
  [1, 6, 'Zjavenie Pána (Traja králi)', 'S', 'w', true],
  [1, 17, 'Sv. Antona, opáta', 'M', 'w'],
  [1, 21, 'Sv. Agnesy, panny a mučenice', 'M', 'r'],
  [1, 24, 'Sv. Františka Saleského, biskupa a učiteľa Cirkvi', 'M', 'w'],
  [1, 25, 'Obrátenie sv. Pavla, apoštola', 'F', 'w'],
  [1, 26, 'Sv. Timoteja a Títa, biskupov', 'M', 'w'],
  [1, 28, 'Sv. Tomáša Akvinského, kňaza a učiteľa Cirkvi', 'M', 'w'],
  [1, 31, 'Sv. Jána Bosca, kňaza', 'M', 'w'],
  [2, 2, 'Obetovanie Pána (Hromnice)', 'FP', 'w'],
  [2, 3, 'Sv. Blažeja, biskupa a mučeníka', 'O', 'r'],
  [2, 5, 'Sv. Agáty, panny a mučenice', 'M', 'r'],
  [2, 6, 'Sv. Pavla Mikiho a spoločníkov, mučeníkov', 'M', 'r'],
  [2, 10, 'Sv. Školastiky, panny', 'M', 'w'],
  [2, 11, 'Preblahoslavenej Panny Márie Lurdskej', 'O', 'w'],
  [2, 14, 'Sv. Cyrila, mnícha, a Metoda, biskupa, patrónov Európy', 'F', 'w'],
  [2, 22, 'Katedra sv. Petra, apoštola', 'F', 'w'],
  [3, 4, 'Sv. Kazimíra', 'O', 'w'],
  [3, 7, 'Sv. Perpetuy a Felicity, mučeníc', 'M', 'r'],
  [3, 19, 'Sv. Jozefa, ženícha Panny Márie', 'S', 'w'],
  [3, 25, 'Zvestovanie Pána', 'S', 'w'],
  [4, 7, 'Sv. Jána Krstiteľa de la Salle, kňaza', 'M', 'w'],
  [4, 11, 'Sv. Stanislava, biskupa a mučeníka', 'M', 'r'],
  [4, 23, 'Sv. Vojtecha, biskupa a mučeníka', 'M', 'r'],
  [4, 25, 'Sv. Marka, evanjelistu', 'F', 'r'],
  [4, 29, 'Sv. Kataríny Sienskej, panny a učiteľky Cirkvi, patrónky Európy', 'F', 'w'],
  [5, 1, 'Sv. Jozefa, robotníka', 'O', 'w'],
  [5, 2, 'Sv. Atanáza, biskupa a učiteľa Cirkvi', 'M', 'w'],
  [5, 3, 'Sv. Filipa a Jakuba, apoštolov', 'F', 'r'],
  [5, 14, 'Sv. Mateja, apoštola', 'F', 'r'],
  [5, 16, 'Sv. Jána Nepomuckého, kňaza a mučeníka', 'M', 'r'],
  [5, 26, 'Sv. Filipa Neriho, kňaza', 'M', 'w'],
  [6, 1, 'Sv. Justína, mučeníka', 'M', 'r'],
  [6, 5, 'Sv. Bonifáca, biskupa a mučeníka', 'M', 'r'],
  [6, 11, 'Sv. Barnabáša, apoštola', 'M', 'r'],
  [6, 13, 'Sv. Antona Paduánskeho, kňaza a učiteľa Cirkvi', 'M', 'w'],
  [6, 21, 'Sv. Alojza Gonzágu, rehoľníka', 'M', 'w'],
  [6, 24, 'Narodenie sv. Jána Krstiteľa', 'S', 'w'],
  [6, 27, 'Sv. Ladislava', 'O', 'w'],
  [6, 28, 'Sv. Ireneja, biskupa a mučeníka, učiteľa Cirkvi', 'M', 'r'],
  [6, 29, 'Sv. Petra a Pavla, apoštolov', 'S', 'r', true],
  [7, 2, 'Návšteva preblahoslavenej Panny Márie', 'F', 'w'],
  [7, 3, 'Sv. Tomáša, apoštola', 'F', 'r'],
  [7, 5, 'Sv. Cyrila a Metoda, slovanských vierozvestov', 'S', 'w'],
  [7, 11, 'Sv. Benedikta, opáta, patróna Európy', 'F', 'w'],
  [7, 15, 'Sv. Bonaventúru, biskupa a učiteľa Cirkvi', 'M', 'w'],
  [7, 16, 'Preblahoslavenej Panny Márie Karmelskej', 'O', 'w'],
  [7, 17, 'Sv. Andreja-Svorada a Benedikta, pustovníkov', 'M', 'w'],
  [7, 22, 'Sv. Márie Magdalény', 'F', 'w'],
  [7, 23, 'Sv. Brigity, rehoľníčky, patrónky Európy', 'F', 'w'],
  [7, 25, 'Sv. Jakuba, apoštola', 'F', 'r'],
  [7, 26, 'Sv. Joachima a Anny, rodičov Panny Márie', 'M', 'w'],
  [7, 27, 'Sv. Gorazda a spoločníkov', 'M', 'w'],
  [7, 29, 'Sv. Marty, Márie a Lazára', 'M', 'w'],
  [7, 31, 'Sv. Ignáca z Loyoly, kňaza', 'M', 'w'],
  [8, 1, 'Sv. Alfonza Máriu de Liguori, biskupa a učiteľa Cirkvi', 'M', 'w'],
  [8, 4, 'Sv. Jána Máriu Vianneya, kňaza', 'M', 'w'],
  [8, 6, 'Premenenie Pána', 'FP', 'w'],
  [8, 8, 'Sv. Dominika, kňaza', 'M', 'w'],
  [8, 9, 'Sv. Terézie Benedikty od Kríža, panny a mučenice, patrónky Európy', 'F', 'r'],
  [8, 10, 'Sv. Vavrinca, diakona a mučeníka', 'F', 'r'],
  [8, 11, 'Sv. Kláry, panny', 'M', 'w'],
  [8, 14, 'Sv. Maximiliána Máriu Kolbeho, kňaza a mučeníka', 'M', 'r'],
  [8, 15, 'Nanebovzatie Panny Márie', 'S', 'w', true],
  [8, 20, 'Sv. Bernarda, opáta a učiteľa Cirkvi', 'M', 'w'],
  [8, 21, 'Sv. Pia X., pápeža', 'M', 'w'],
  [8, 22, 'Panny Márie Kráľovnej', 'M', 'w'],
  [8, 24, 'Sv. Bartolomeja, apoštola', 'F', 'r'],
  [8, 27, 'Sv. Moniky', 'M', 'w'],
  [8, 28, 'Sv. Augustína, biskupa a učiteľa Cirkvi', 'M', 'w'],
  [8, 29, 'Mučenícka smrť sv. Jána Krstiteľa', 'M', 'r'],
  [9, 3, 'Sv. Gregora Veľkého, pápeža a učiteľa Cirkvi', 'M', 'w'],
  [9, 7, 'Sv. Marka Križina, Melichara Grodzieckeho a Štefana Pongrácza, kňazov a mučeníkov', 'M', 'r'],
  [9, 8, 'Narodenie preblahoslavenej Panny Márie', 'F', 'w'],
  [9, 12, 'Najsvätejšieho mena Panny Márie', 'O', 'w'],
  [9, 13, 'Sv. Jána Zlatoústeho, biskupa a učiteľa Cirkvi', 'M', 'w'],
  [9, 14, 'Povýšenie svätého Kríža', 'FP', 'r'],
  [9, 15, 'Sedembolestnej Panny Márie, patrónky Slovenska', 'S', 'w', true],
  [9, 16, 'Sv. Kornela, pápeža, a Cypriána, biskupa, mučeníkov', 'M', 'r'],
  [9, 20, 'Sv. Ondreja Kima Taegona, kňaza, a spoločníkov, mučeníkov', 'M', 'r'],
  [9, 21, 'Sv. Matúša, apoštola a evanjelistu', 'F', 'r'],
  [9, 23, 'Sv. Pia z Pietrelčiny, kňaza', 'M', 'w'],
  [9, 27, 'Sv. Vincenta de Paul, kňaza', 'M', 'w'],
  [9, 29, 'Sv. Michala, Gabriela a Rafaela, archanjelov', 'F', 'w'],
  [9, 30, 'Sv. Hieronyma, kňaza a učiteľa Cirkvi', 'M', 'w'],
  [10, 1, 'Sv. Terézie od Dieťaťa Ježiša (z Lisieux), panny a učiteľky Cirkvi', 'M', 'w'],
  [10, 2, 'Svätých anjelov strážcov', 'M', 'w'],
  [10, 4, 'Sv. Františka Assiského', 'M', 'w'],
  [10, 7, 'Ružencovej Panny Márie', 'M', 'w'],
  [10, 15, 'Sv. Terézie od Ježiša (z Avily), panny a učiteľky Cirkvi', 'M', 'w'],
  [10, 16, 'Sv. Margity Márie Alacoque, panny', 'O', 'w'],
  [10, 17, 'Sv. Ignáca Antiochijského, biskupa a mučeníka', 'M', 'r'],
  [10, 18, 'Sv. Lukáša, evanjelistu', 'F', 'r'],
  [10, 22, 'Sv. Jána Pavla II., pápeža', 'O', 'w'],
  [10, 28, 'Sv. Šimona a Júdu, apoštolov', 'F', 'r'],
  [11, 1, 'Všetkých svätých', 'S', 'w', true],
  [11, 2, 'Spomienka na všetkých verných zosnulých (Dušičky)', 'M+', 'v'],
  [11, 4, 'Sv. Karola Boromejského, biskupa', 'M', 'w'],
  [11, 9, 'Výročie posviacky Lateránskej baziliky', 'F', 'w'],
  [11, 10, 'Sv. Leva Veľkého, pápeža a učiteľa Cirkvi', 'M', 'w'],
  [11, 11, 'Sv. Martina z Tours, biskupa', 'M', 'w'],
  [11, 12, 'Sv. Jozafáta, biskupa a mučeníka', 'M', 'r'],
  [11, 17, 'Sv. Alžbety Uhorskej, rehoľníčky', 'M', 'w'],
  [11, 21, 'Obetovanie preblahoslavenej Panny Márie', 'M', 'w'],
  [11, 22, 'Sv. Cecílie, panny a mučenice', 'M', 'r'],
  [11, 24, 'Sv. Ondreja Dung-Laka, kňaza, a spoločníkov, mučeníkov', 'M', 'r'],
  [11, 30, 'Sv. Ondreja, apoštola', 'F', 'r'],
  [12, 3, 'Sv. Františka Xaverského, kňaza', 'M', 'w'],
  [12, 6, 'Sv. Mikuláša, biskupa', 'O', 'w'],
  [12, 7, 'Sv. Ambróza, biskupa a učiteľa Cirkvi', 'M', 'w'],
  [12, 8, 'Nepoškvrnené počatie preblahoslavenej Panny Márie', 'S', 'w', true],
  [12, 13, 'Sv. Lucie, panny a mučenice', 'M', 'r'],
  [12, 14, 'Sv. Jána z Kríža, kňaza a učiteľa Cirkvi', 'M', 'w'],
  [12, 25, 'Narodenie Pána (Vianoce)', 'S', 'w', true],
  [12, 26, 'Sv. Štefana, prvého mučeníka', 'F', 'r'],
  [12, 27, 'Sv. Jána, apoštola a evanjelistu', 'F', 'w'],
  [12, 28, 'Svätých Neviniatok, mučeníkov', 'F', 'r'],
  [12, 31, 'Sv. Silvestra I., pápeža', 'O', 'w'],
];

const RANK_MAP = {
  S: RANKS.SOLEMNITY,
  FP: RANKS.LORD_FEAST,
  F: RANKS.FEAST,
  'M+': RANKS.MEMORIAL,
  M: RANKS.MEMORIAL,
  O: RANKS.OPTIONAL,
};
const COLOR_MAP = { w: COLORS.white, r: COLORS.red, g: COLORS.green, v: COLORS.violet };

function fixedCelebrations(date) {
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  return F
    .filter((f) => f[0] === m && f[1] === d && f[3] !== 'X')
    .map((f) => ({
      name: f[2],
      rank: RANK_MAP[f[3]],
      rankLabel: RANK_LABELS[RANK_MAP[f[3]]] || null,
      color: COLOR_MAP[f[4]],
      holyDay: !!f[5],
    }));
}

// ---------------------------------------------------------------------------
// Určenie liturgického obdobia
// ---------------------------------------------------------------------------

function ordinal(n) {
  return `${n}.`;
}

const ADVENT_SUNDAYS = ['Prvá adventná nedeľa', 'Druhá adventná nedeľa',
  'Tretia adventná nedeľa (Gaudete)', 'Štvrtá adventná nedeľa'];
const LENT_SUNDAYS = ['Prvá pôstna nedeľa', 'Druhá pôstna nedeľa', 'Tretia pôstna nedeľa',
  'Štvrtá pôstna nedeľa (Laetare)', 'Piata pôstna nedeľa'];

function seasonInfo(date) {
  const y = date.getUTCFullYear();
  const k = keyDates(y);

  // Advent a Vianoce (prelom rokov)
  if (date >= k.advent1 && date < k.christmas) {
    return { season: 'advent', seasonName: 'Adventné obdobie', key: k };
  }
  if (date >= k.christmas) {
    return { season: 'christmas', seasonName: 'Vianočné obdobie', key: k };
  }
  if (date <= k.baptism) {
    return { season: 'christmas', seasonName: 'Vianočné obdobie', key: k };
  }
  if (date < k.ashWednesday) {
    return { season: 'ordinary', seasonName: 'Cezročné obdobie', key: k };
  }
  if (date < k.holyThursday) {
    return { season: 'lent', seasonName: 'Pôstne obdobie', key: k };
  }
  if (date <= k.holySaturday) {
    return { season: 'triduum', seasonName: 'Veľkonočné trojdnie', key: k };
  }
  if (date <= k.pentecost) {
    return { season: 'easter', seasonName: 'Veľkonočné obdobie', key: k };
  }
  return { season: 'ordinary', seasonName: 'Cezročné obdobie', key: k };
}

function ordinaryWeek(date, k) {
  const sunday = prevOrSameSunday(date);
  if (date < k.ashWednesday) {
    // Prvá časť: týždne sa rátajú od Krstu Krista Pána.
    return Math.max(1, Math.round(diffDays(sunday, k.baptism) / 7) + 1);
  }
  // Druhá časť: dopočítava sa odzadu tak, aby posledný týždeň bol 34.
  return 35 - Math.round(diffDays(k.advent1, sunday) / 7);
}

function seasonColor(season) {
  switch (season) {
    case 'advent':
    case 'lent': return COLORS.violet;
    case 'christmas':
    case 'easter': return COLORS.white;
    default: return COLORS.green;
  }
}

// ---------------------------------------------------------------------------
// Hlavná funkcia: úplný popis liturgického dňa
// ---------------------------------------------------------------------------

export function getLiturgicalDay(date) {
  const { season, seasonName, key: k } = seasonInfo(date);
  const dow = date.getUTCDay();
  const isSunday = dow === 0;
  const y = date.getUTCFullYear();

  let title = null;
  let subtitle = null;
  let color = seasonColor(season);
  let week = null;
  let weekLabel = null;
  let holyDay = false;
  let extras = [];

  const fixed = fixedCelebrations(date);
  const fixedTop = fixed[0] || null;

  // --- Pevné body roka s najvyššou prednosťou -----------------------------
  if (sameDay(date, k.ashWednesday)) {
    return done('Popolcová streda', 'deň pokánia a pôstu', COLORS.violet);
  }
  if (sameDay(date, k.palmSunday)) {
    return done('Kvetná nedeľa – Nedeľa utrpenia Pána', null, COLORS.red);
  }
  if (season === 'lent' && date > k.palmSunday) {
    const names = { 1: 'Pondelok Veľkého týždňa', 2: 'Utorok Veľkého týždňa', 3: 'Streda Veľkého týždňa' };
    return done(names[dow] || 'Veľký týždeň', null, COLORS.violet);
  }
  if (sameDay(date, k.holyThursday)) {
    return done('Zelený štvrtok – Pánovej večere', 'Veľkonočné trojdnie', COLORS.white);
  }
  if (sameDay(date, k.goodFriday)) {
    return done('Veľký piatok – Slávenie utrpenia a smrti Pána', 'prísny pôst', COLORS.red, true);
  }
  if (sameDay(date, k.holySaturday)) {
    return done('Biela sobota – Veľkonočná vigília', 'Veľkonočné trojdnie', COLORS.white);
  }
  if (sameDay(date, k.easter)) {
    return done('Veľkonočná nedeľa Pánovho zmŕtvychvstania', 'slávnosť s oktávou', COLORS.white, true);
  }
  if (date > k.easter && date < k.divineMercy) {
    const names = { 1: 'Veľkonočný pondelok', 2: 'Veľkonočný utorok', 3: 'Veľkonočná streda',
      4: 'Veľkonočný štvrtok', 5: 'Veľkonočný piatok', 6: 'Veľkonočná sobota' };
    return done(`${names[dow]} (oktáva)`, 'slávnosť', COLORS.white);
  }
  if (sameDay(date, k.divineMercy)) {
    return done('Druhá veľkonočná nedeľa – Nedeľa Božieho milosrdenstva', null, COLORS.white);
  }
  if (sameDay(date, k.ascension)) {
    return done('Nanebovstúpenie Pána', 'slávnosť, prikázaný sviatok', COLORS.white, true);
  }
  if (sameDay(date, k.pentecost)) {
    return done('Zoslanie Ducha Svätého (Turíce)', 'slávnosť', COLORS.red, true);
  }
  if (sameDay(date, k.maryMotherOfChurch)) {
    return done('Preblahoslavenej Panny Márie, Matky Cirkvi', 'spomienka', COLORS.white);
  }
  if (sameDay(date, k.trinity)) {
    return done('Najsvätejšej Trojice', 'slávnosť', COLORS.white);
  }
  if (sameDay(date, k.corpusChristi)) {
    return done('Najsvätejšieho Kristovho Tela a Krvi', 'slávnosť, prikázaný sviatok', COLORS.white, true);
  }
  if (sameDay(date, k.sacredHeart)) {
    return done('Najsvätejšieho Srdca Ježišovho', 'slávnosť', COLORS.white);
  }
  if (sameDay(date, k.immaculateHeart) && !(fixedTop && fixedTop.rank === RANKS.SOLEMNITY)) {
    return done('Nepoškvrneného Srdca preblahoslavenej Panny Márie', 'spomienka', COLORS.white);
  }
  if (sameDay(date, k.christKing) && season === 'ordinary') {
    return done('Nášho Pána Ježiša Krista, Kráľa neba i zeme (Krista Kráľa)', 'slávnosť', COLORS.white);
  }
  // Spomienka na všetkých verných zosnulých má prednosť aj pred nedeľou.
  if (date.getUTCMonth() === 10 && date.getUTCDate() === 2) {
    return done('Spomienka na všetkých verných zosnulých (Dušičky)', null, COLORS.violet);
  }

  // --- Vianočné obdobie ----------------------------------------------------
  if (season === 'christmas') {
    if (sameDay(date, k.baptism)) {
      return done('Krst Krista Pána', 'sviatok', COLORS.white);
    }
    // Svätá rodina: nedeľa v oktáve Narodenia Pána, inak 30. 12.
    const isInOctave = date >= k.christmas && date <= utcDate(y, 12, 31);
    const dec25Sunday = k.christmas.getUTCDay() === 0;
    const holyFamily = (isSunday && isInOctave && !sameDay(date, k.christmas))
      || (dec25Sunday && sameDay(date, utcDate(y, 12, 30)));
    if (holyFamily) {
      return done('Svätej rodiny Ježiša, Márie a Jozefa', 'sviatok', COLORS.white);
    }
    if (isSunday && date >= utcDate(y, 1, 2) && date < k.epiphany) {
      return done('Druhá nedeľa po narodení Pána', null, COLORS.white);
    }
  }

  // --- Nedele s prednosťou pred slávnosťami (Advent, Pôst, Veľká noc) ------
  if (isSunday && season === 'advent') {
    const n = Math.floor(diffDays(date, k.advent1) / 7);
    const rose = n === 2;
    return done(ADVENT_SUNDAYS[n] || 'Adventná nedeľa', null, rose ? COLORS.rose : COLORS.violet);
  }
  if (isSunday && season === 'lent') {
    const firstLentSunday = addDays(k.ashWednesday, 4);
    const n = Math.floor(diffDays(date, firstLentSunday) / 7);
    const rose = n === 3;
    return done(LENT_SUNDAYS[n] || 'Pôstna nedeľa', null, rose ? COLORS.rose : COLORS.violet);
  }
  if (isSunday && season === 'easter') {
    const n = Math.floor(diffDays(date, k.easter) / 7) + 1;
    const names = { 3: 'Tretia veľkonočná nedeľa', 4: 'Štvrtá veľkonočná nedeľa (Nedeľa Dobrého pastiera)',
      5: 'Piata veľkonočná nedeľa', 6: 'Šiesta veľkonočná nedeľa', 7: 'Siedma veľkonočná nedeľa' };
    return done(names[n] || `${ordinal(n)} veľkonočná nedeľa`, null, COLORS.white);
  }

  // --- Slávnosti a sviatky z pevného kalendára -----------------------------
  if (fixedTop && fixedTop.rank === RANKS.SOLEMNITY) {
    // Slávnosť v kolízii s nedeľou Adventu/Pôstu/Veľkej noci sa prekladá na pondelok.
    if (isSunday && (season === 'advent' || season === 'lent' || season === 'easter')) {
      extras.push(`${fixedTop.name} — slávnosť presunutá na pondelok`);
    } else {
      return done(fixedTop.name, fixedTop.holyDay ? 'slávnosť, prikázaný sviatok' : 'slávnosť',
        fixedTop.color, fixedTop.holyDay);
    }
  }
  if (fixedTop && fixedTop.rank === RANKS.LORD_FEAST) {
    // Sviatok Pána má v Cezročnom a Vianočnom období prednosť aj pred nedeľou.
    return done(fixedTop.name, 'sviatok Pána', fixedTop.color);
  }

  // --- Bežné nedele ---------------------------------------------------------
  week = season === 'ordinary' ? ordinaryWeek(date, k) : null;
  if (isSunday) {
    if (season === 'ordinary') {
      return done(`${ordinal(week)} nedeľa v Cezročnom období`, null, COLORS.green);
    }
    return done(`Nedeľa — ${seasonName}`, null, color);
  }

  // --- Všedné dni -----------------------------------------------------------
  if (season === 'advent') {
    const n = Math.floor(diffDays(date, k.advent1) / 7) + 1;
    weekLabel = date >= utcDate(y, 12, 17)
      ? `Féria — ${formatDateSk(date, { withYear: false })} (predvianočné dni)`
      : `Féria — ${ordinal(n)} adventný týždeň`;
    week = n;
  } else if (season === 'lent') {
    const firstLentSunday = addDays(k.ashWednesday, 4);
    const n = date < firstLentSunday ? 0 : Math.floor(diffDays(date, firstLentSunday) / 7) + 1;
    weekLabel = n === 0 ? 'Féria — dni po Popolcovej strede' : `Féria — ${ordinal(n)} pôstny týždeň`;
    week = n;
  } else if (season === 'easter') {
    const n = Math.floor(diffDays(date, k.easter) / 7) + 1;
    weekLabel = `Féria — ${ordinal(n)} veľkonočný týždeň`;
    week = n;
  } else if (season === 'christmas') {
    weekLabel = 'Féria vo Vianočnom období';
  } else {
    weekLabel = `Féria — ${ordinal(week)} týždeň v Cezročnom období`;
  }

  if (fixedTop && fixedTop.rank >= RANKS.FEAST) {
    return done(fixedTop.name, fixedTop.rankLabel, fixedTop.color);
  }
  if (fixedTop && fixedTop.rank === RANKS.MEMORIAL) {
    // V Pôstnom a Adventnom (17.–24. 12.) období sú spomienky len ľubovoľné.
    const downgraded = season === 'lent'
      || (season === 'advent' && date >= utcDate(y, 12, 17));
    return done(fixedTop.name, downgraded ? 'ľubovoľná spomienka' : 'spomienka',
      downgraded ? color : fixedTop.color);
  }
  if (fixedTop && fixedTop.rank === RANKS.OPTIONAL) {
    extras.unshift(`${fixedTop.name} (ľubovoľná spomienka)`);
  }
  return done(weekLabel || 'Féria', null, color);

  function done(t, s, c, h = false) {
    const allHoly = h || holyDay || (fixedTop && fixedTop.holyDay && t === fixedTop.name);
    return {
      date,
      iso: toInputValue(date),
      dayName: DAYS_SK[dow],
      dateLabel: formatDateSk(date),
      dateShort: formatDateNum(date),
      season,
      seasonName,
      week,
      title: t,
      subtitle: s || null,
      color: c,
      isSunday,
      holyDay: !!allHoly,
      extras,
    };
  }
}

// Súhrnný popis týždňa pre hlavičku oznamov: vychádza z nedele v danom rozsahu.
export function getWeekSummary(startDate, days = 8) {
  const list = [];
  for (let i = 0; i < days; i++) list.push(getLiturgicalDay(addDays(startDate, i)));
  const sunday = list.find((d) => d.isSunday) || list[0];
  const end = addDays(startDate, days - 1);
  const sameMonth = startDate.getUTCMonth() === end.getUTCMonth();
  const range = sameMonth
    ? `${startDate.getUTCDate()}. – ${formatDateSk(end)}`
    : `${formatDateSk(startDate, { withYear: false })} – ${formatDateSk(end)}`;

  let label = sunday.title;
  if (sunday.season === 'ordinary' && sunday.week) {
    label = `${sunday.week}. týždeň v Cezročnom období`;
  } else if (sunday.season === 'advent' || sunday.season === 'lent' || sunday.season === 'easter') {
    label = sunday.title;
  }
  return { days: list, sunday, range, label, season: sunday.seasonName };
}
