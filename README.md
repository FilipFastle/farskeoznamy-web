# Farské oznamy · Zvolen

Statická webaplikácia, ktorá **sleduje webstránky farností** (texty, PDF, obrázky),
zobrazuje prehľad oznamov a zmien, a obsahuje **správcovský panel** s generátorom
PDF farských oznamov napojeným na **liturgický kalendár**. Dizajn: liquid glass,
plne responzívne (mobil aj počítač).

Sledované farnosti na štart:

| Farnosť | Sledovaná stránka |
|---|---|
| Zvolen – Mesto | https://farazv.sk/farnost/farske-oznamy |
| Zvolen – Sekier | https://www.farasekier.sk/?Farske-oznamy |
| Zvolen – Západ | https://farnostzvolenzapad.sk/rozpis/ |
| Gréckokatolíci Zvolen | https://www.grkatzv.sk/ |
| CUP Zvolen | https://www.cupzvolen.sk/aktualne/ |

## Ako to funguje

```
GitHub Actions (cron, každú hodinu)
  └─ scripts/check.mjs  → stiahne stránky farností, PDF a obrázky,
     porovná SHA-256 odtlačky a pri zmene commitne public/data/*.json
        └─ push do repozitára → Cloudflare Pages automaticky nasadí web

Cloudflare Pages (statický hosting, adresár public/)
  ├─ index.html  – verejný prehľad oznamov a zmien
  └─ admin.html  – správa farností + generátor PDF (login)
```

- **Žiadny server ani databáza** — všetky dáta sú JSON súbory v repozitári.
- **Kontrola každú hodinu** cez `.github/workflows/check.yml` (commitne sa len
  skutočná zmena, takže sa neminie limit buildov Cloudflare Pages).
- **Generátor PDF** beží celý v prehliadači (jsPDF + vložený font DejaVu Sans
  so slovenskou diakritikou) — nič sa nikam neposiela.
- **Liturgický kalendár** (`public/js/liturgical.js`) počíta obdobia, nedele,
  slávnosti, sviatky aj spomienky slovenského kalendára vrátane pohyblivých
  dátumov (Veľká noc, Turíce, Božie Telo…), generátor z neho predvyplní
  rozpis — všetko sa dá ručne upraviť.

## Nasadenie

### 1. GitHub

Repozitár stačí mať na GitHube — hodinová kontrola sa spúšťa sama
(workflow beží na **predvolenej vetve**; po 60 dňoch bez aktivity ju GitHub
pozastaví a treba ju v záložke *Actions* znova povoliť; manuálne spustenie:
*Actions → Kontrola farských oznamov → Run workflow*).

### 2. Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Vyberte tento repozitár a produkčnú vetvu (napr. `main`).
3. Nastavenia buildu:
   - **Framework preset:** None
   - **Build command:** *(prázdne)*
   - **Build output directory:** `public`
4. Deploy. Bezpečnostné hlavičky sa nastavia automaticky zo súboru `public/_headers`.

### 3. Prihlásenie do správy

Adresa `/admin.html`. Predvolený účet: používateľ **admin** (heslo bolo zadané
pri zriadení webu). Zmena hesla:

```bash
node scripts/hash-password.mjs "NoveSilneHeslo"
# výstup vložte do AUTH v public/js/config.js a commitnite
```

### 4. Publikovanie zmien zo správy (GitHub token)

Aby panel vedel ukladať farnosti priamo do repozitára:

1. GitHub → *Settings → Developer settings → Fine-grained personal access tokens*.
2. **Repository access:** iba tento repozitár; **Permissions → Contents: Read & Write**.
3. Token vložte v správe do *Nastavenia → GitHub prepojenie* (uloží sa
   **zašifrovaný** AES-GCM kľúčom odvodeným z prihlasovacieho hesla).
4. V poli *Vetva pre zápis* nastavte vetvu, z ktorej Cloudflare Pages nasadzuje.

Bez tokenu funguje *Exportovať JSON* — stiahnutý `parishes.json` commitnete ručne.

## Správcovský panel

- **Farnosti** — pridávanie, úprava, mazanie a poradie farností; pre každú
  farnosť aj predvolené sväté omše (predvyplnia sa v generátore), hlavička
  a kontakt pre PDF, možnosť vypnúť kontrolu.
- **Generátor PDF** — vyberiete farnosť a nedeľu, kalendár predvyplní
  liturgické dni (vrátane farby), omše z predvolieb; doplníte úmysly a oznamy
  a stiahnete hotové PDF. Koncepty sa dajú uložiť v prehliadači.
- **Stav kontroly** — posledný beh, chyby, počty dokumentov.
- **Nastavenia** — GitHub token, vetva, bezpečnostné informácie.

## Bezpečnosť

Čo je zapnuté:

- prísna **Content-Security-Policy** (žiadne inline skripty, žiadne cudzie CDN,
  spojenia len na vlastnú doménu a `api.github.com`), `X-Frame-Options: DENY`,
  `nosniff`, `Referrer-Policy: no-referrer`, HSTS — viď `public/_headers`;
- heslo sa overuje cez **PBKDF2-SHA-256 (600 000 iterácií)**, ukladá sa len odtlačok;
- **brzdenie pokusov** o prihlásenie (exponenciálne čakanie), automatické
  odhlásenie po nečinnosti;
- GitHub token uložený **šifrovaný (AES-GCM 256)** kľúčom odvodeným z hesla;
- obsah stiahnutý z webov farností sa vykresľuje výlučne cez `textContent`
  (ochrana pred XSS z cudzích stránok), odkazy sa púšťajú len `http(s)`;
- kontrolný skript má limity veľkosti a časové limity sťahovania.

**Úprimné upozornenie:** statická stránka nemá server, takže prihlásenie chráni
rozhranie a zašifrovaný token, nie dáta (tie sú verejné JSON-y — farské oznamy
sú beztak verejné). Ak chcete admin stránku schovať aj na úrovni servera,
zapnite zadarmo **Cloudflare Access**: *Zero Trust → Access → Applications →
Add an application → Self-hosted*, cesta `vasadomena/admin.html`, pravidlo
napr. e-mail s jednorazovým kódom.

## Štruktúra repozitára

```
public/                  ← výstupný adresár pre Cloudflare Pages
  index.html             verejná stránka
  admin.html             správa + generátor PDF
  css/styles.css         liquid glass dizajn
  js/
    config.js            nastavenia, odtlačok hesla, repozitár
    liturgical.js        liturgický kalendár (SK)
    app.js               verejná stránka
    admin.js             panel správy
    pdfgen.js            generátor PDF
    auth.js              prihlásenie, šifrovanie tokenu
    github.js            GitHub Contents API
    util.js              bezpečné DOM utility
  fonts/dejavu-sans.js   font pre PDF (base64, slovenská diakritika)
  vendor/jspdf.umd.min.js
  data/
    parishes.json        zoznam farností (upravuje správa)
    status.json          stav oznamov (zapisuje kontrola)
    history.json         história zmien (zapisuje kontrola)
  _headers               bezpečnostné hlavičky (Cloudflare Pages)
scripts/
  check.mjs              hodinová kontrola oznamov (bez závislostí)
  hash-password.mjs      generátor odtlačku hesla
.github/workflows/check.yml
```

## Lokálny vývoj

```bash
python3 -m http.server 8788 --directory public
# alebo: npx serve public
node scripts/check.mjs            # manuálna kontrola oznamov
node scripts/check.mjs --parishes test/fixture.json --out /tmp/out   # test
```

---

© 2026 Filip Stašek
