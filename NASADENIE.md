# Návod na nasadenie a spustenie — Farské oznamy

Kompletný postup od nahratia na GitHub cez Cloudflare Pages až po prvé
prihlásenie do správy. Nič z toho netreba robiť opakovane — po nasadení už
všetko beží samo (kontrola oznamov každú hodinu, automatické nasadenie pri
každej zmene).

> **Čo budete potrebovať:** účet na [github.com](https://github.com) a účet na
> [cloudflare.com](https://dash.cloudflare.com) (oba zadarmo). Celé nasadenie
> zaberie cca 10 minút.

---

## 1. GitHub — príprava repozitára

Kód je v repozitári `FilipFastle/farskeoznamy-web` vo vetve
`claude/eloquent-pascal-gzhth4`. Odporúčam ju premenovať na `main`, aby mal
repozitár štandardnú hlavnú vetvu (na nej beží hodinová kontrola aj nasadenie).

### 1a. Premenovanie vetvy na `main` (cez web — najjednoduchšie)

1. Otvorte repozitár na GitHube → záložka **Code**.
2. Kliknite na rozbaľovník vetiev (vľavo hore, je tam názov vetvy) →
   **View all branches**.
3. Pri vetve `claude/eloquent-pascal-gzhth4` kliknite na **ceruzku (Rename branch)**.
4. Zadajte nový názov: `main` → **Rename branch**.

GitHub automaticky presmeruje všetko potrebné. Hotovo.

<details>
<summary>Alternatíva: premenovanie cez príkazový riadok</summary>

```bash
git clone https://github.com/FilipFastle/farskeoznamy-web.git
cd farskeoznamy-web
git checkout claude/eloquent-pascal-gzhth4
git branch -m main
git push -u origin main
git push origin --delete claude/eloquent-pascal-gzhth4
# potom na GitHube: Settings → General → Default branch → main
```
</details>

### 1b. Ak by ste niekedy nahrávali projekt od nuly

```bash
cd farskeoznamy-web                # priečinok s projektom
git init -b main
git add -A
git commit -m "Prvé nahratie"
git remote add origin https://github.com/FilipFastle/farskeoznamy-web.git
git push -u origin main
```

### 1c. Zapnutie a prvé spustenie hodinovej kontroly

1. V repozitári otvorte záložku **Actions**.
2. Ak GitHub zobrazí tlačidlo *„I understand my workflows, go ahead and enable
   them"*, potvrďte ho.
3. Vľavo vyberte workflow **„Kontrola farských oznamov"** → vpravo
   **Run workflow** → **Run workflow** (zelené tlačidlo).
4. Po 1 – 2 minútach beh skončí — v súhrne behu uvidíte zoznam farností
   (🟢/🔴). Pri prvom behu sa naplnia dáta oznamov
   (`public/data/status.json`, `history.json`) a workflow ich commitne.

Odteraz kontrola beží **automaticky každú hodinu** (cron `23 * * * *`,
t. j. vždy 23 minút po celej hodine; GitHub môže beh o pár minút posunúť).

> ⚠️ **Dôležité:** ak v repozitári 60 dní nenastane žiadna aktivita, GitHub
> naplánované behy pozastaví a pošle e-mail. Stačí ich v záložke Actions
> jedným klikom znova povoliť (**Enable workflow**).

---

## 2. Cloudflare Pages — nasadenie webu

1. Prihláste sa na [dash.cloudflare.com](https://dash.cloudflare.com).
2. V ľavom menu: **Workers & Pages** → **Create** (alebo *Create application*)
   → karta **Pages** → **Connect to Git** (môže byť aj *Import an existing Git repository*).
3. Prepojte GitHub účet (tlačidlo **Connect GitHub**) a povoľte Cloudflare
   prístup — stačí k repozitáru `farskeoznamy-web` (možnosť *Only select
   repositories*).
4. Vyberte repozitár **farskeoznamy-web** → **Begin setup**.
5. Nastavenia buildu — vyplňte presne takto:

   | Pole | Hodnota |
   |---|---|
   | **Project name** | `farskeoznamy` (z toho vznikne adresa `farskeoznamy.pages.dev`) |
   | **Production branch** | `main` |
   | **Framework preset** | `None` |
   | **Build command** | *(nechať prázdne)* |
   | **Build output directory** | `public` |

6. Kliknite **Save and Deploy**. Prvé nasadenie trvá ~1 minútu.
7. Web je dostupný na **`https://farskeoznamy.pages.dev`**
   (presnú adresu ukáže Cloudflare po nasadení).

Bezpečnostné hlavičky (CSP, HSTS, …) sa nastavia automaticky zo súboru
`public/_headers` — netreba nič klikať.

**Odteraz platí:** každý push do vetvy `main` (vrátane automatických commitov
hodinovej kontroly) spustí nové nasadenie. Keďže kontrola commitne **len keď
sa oznamy naozaj zmenia**, zmestíte sa s veľkou rezervou do limitu 500
buildov mesačne na free pláne.

### 2a. Vlastná doména (voliteľné)

Pages projekt → záložka **Custom domains** → **Set up a custom domain** →
zadajte doménu a potvrďte DNS záznam, ktorý Cloudflare ponúkne.

---

## 3. Prvé prihlásenie do správy

1. Otvorte `https://vasa-adresa.pages.dev/admin.html`.
2. Prihláste sa: používateľ **`admin`** + heslo zadané pri zriadení webu.

Po prihlásení máte 4 záložky: **Farnosti** (pridávanie/úprava),
**Generátor PDF**, **Stav kontroly** a **Nastavenia**.

### 3a. GitHub token — aby šlo publikovať farnosti priamo z panela

Bez tokenu panel funguje tiež (tlačidlo *Exportovať JSON* + ručný commit),
ale s tokenom sa zmeny ukladajú na klik:

1. Na GitHube: **Settings** (vášho účtu) → **Developer settings** →
   **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. Vyplňte:
   - **Token name:** napr. `farske-oznamy-panel`
   - **Expiration:** napr. 1 rok
   - **Repository access:** *Only select repositories* → `farskeoznamy-web`
   - **Permissions → Repository permissions → Contents:** **Read and write**
     (nič iné netreba)
3. **Generate token** a token si skopírujte (zobrazí sa len raz).
4. V správe webu: **Nastavenia → GitHub prepojenie** → vložte token,
   **Vetva pre zápis:** `main` → **Uložiť a overiť**.

Token sa v prehliadači ukladá **zašifrovaný** (AES-GCM kľúčom odvodeným z
vášho hesla) — pri ďalšom prihlásení ho netreba zadávať znova.

### 3b. Skúška celého kolobehu

1. **Farnosti → + Pridať farnosť** → vyplňte názov a URL → **Pridať farnosť**
   → **Publikovať na GitHub**.
2. Do 1 – 2 minút Cloudflare nasadí novú verziu — farnosť sa objaví na
   verejnej stránke.
3. Najbližší beh kontroly (alebo manuálny cez Actions) ju začne sledovať.

---

## 4. Bežná prevádzka

| Čo chcem | Ako |
|---|---|
| Pridať/upraviť farnosť | Správa → Farnosti → Publikovať na GitHub |
| Vygenerovať oznamy do PDF | Správa → Generátor PDF → vybrať farnosť a nedeľu → doplniť úmysly/oznamy → ⬇ Stiahnuť PDF |
| Pozrieť, či kontrola beží | Správa → Stav kontroly, alebo GitHub → Actions |
| Spustiť kontrolu hneď | GitHub → Actions → Kontrola farských oznamov → Run workflow |
| Zmeniť heslo správy | `node scripts/hash-password.mjs "NoveHeslo"` → výstup vložiť do `public/js/config.js` → commit + push |
| Predvolené omše farnosti | Správa → Farnosti → Upraviť → sekcia „Predvolené sväté omše" |

### Lokálne spustenie (vývoj/úpravy)

```bash
git clone https://github.com/FilipFastle/farskeoznamy-web.git
cd farskeoznamy-web
python3 -m http.server 8788 --directory public
# → http://localhost:8788  (alebo: npx serve public)

node scripts/check.mjs        # manuálny beh kontroly oznamov
```

---

## 5. Voliteľné: serverová ochrana správy (Cloudflare Access)

Prihlásenie v aplikácii chráni rozhranie, no statický web nemá server. Ak
chcete, aby `/admin.html` vôbec nebolo dostupné bez overenia, zapnite
Cloudflare Access (free do 50 používateľov):

1. Cloudflare dashboard → **Zero Trust** (prvýkrát si vypýta názov tímu).
2. **Access → Applications → Add an application → Self-hosted**.
3. **Application domain:** vaša doména, **Path:** `admin.html`.
4. Pridajte politiku, napr. *Allow* → *Emails* → váš e-mail
   (overenie jednorazovým kódom na e-mail).
5. Uložte — od tej chvíle Cloudflare pustí na admin stránku
   len overených ľudí.

---

## 6. Riešenie problémov

| Problém | Riešenie |
|---|---|
| Build na Cloudflare zlyhá | Skontrolujte *Build output directory* = `public` a prázdny *Build command* |
| Na webe sú „Čaká na prvú kontrolu" | Spustite workflow ručne (Actions → Run workflow) a počkajte na nasadenie |
| „Publikovanie zlyhalo: GitHub API 404/403" | Token nemá prístup k repozitáru alebo právo *Contents: Read & Write*; skontrolujte aj vetvu (`main`) |
| Hodinová kontrola prestala bežať | Po 60 dňoch bez aktivity ju GitHub pozastavil — Actions → Enable workflow |
| „Posledná kontrola: nepodarilo sa zistiť" | Pri **súkromnom** repozitári sa čas behu nedá čítať bez prihlásenia — kontrola však beží normálne |
| Zabudnuté heslo | `node scripts/hash-password.mjs "NoveHeslo"` → vložiť do `public/js/config.js` → push |
| Farnosť má oznamy v časti stránky, ktorú netreba sledovať celú | V `public/data/parishes.json` pridajte farnosti polia `startMarker`/`endMarker` (kúsky HTML, medzi ktorými je obsah) |

---

*Podrobnosti o architektúre, bezpečnosti a štruktúre súborov sú v [README.md](README.md).*
