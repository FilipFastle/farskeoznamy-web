# Architektúra stránky

## Stránky (statické, menu)

| Stránka | Účel | Poznámka |
|---|---|---|
| **Domov** | Rýchly prehľad: najbližšie omše, posledný oznam, odkazy | Skladá sa z blokov, pozri `uvodna-stranka.html` |
| **Farnosť** | O farnosti, kňazi, história | Text + fotky kňazov |
| **Sviatosti** | Krst, birmovka, sobáš, spoveď, pomazanie chorých — podmienky a kontakt | Pozri `sviatosti.html` |
| **Bohoslužby** | Pravidelný rozpis omší podľa kostolov + výnimky/sviatky | Pozri `rozpis-bohosluzieb.html` |
| **Kontakt** | Adresa, úradné hodiny, telefón, e-mail, kontaktný formulár, mapa | Pozri `kontakt-a-info.html` |
| **Oznamy** (archív) | Automatický zoznam všetkých príspevkov v kategórii *Oznamy* | Nie je to samostatná ručne písaná stránka — pozri nižšie |
| **Galéria** (rozcestník) | Automatický zoznam albumov (príspevkov v kategórii *Galéria*), zoradené podľa roku/udalosti | Pozri nižšie |

## Menu (odporúčané poradie)

```
Domov · Farnosť · Sviatosti · Bohoslužby · Oznamy · Galéria · Kontakt
```

## Príspevky (dynamický obsah — nie stránky)

Oznamy aj galéria **nie sú samostatné Stránky (Pages)**, ale **Príspevky
(Posts)** — vďaka tomu WordPress automaticky:

- radí ich chronologicky (najnovší oznam/album hore),
- vie ich naplánovať na budúci dátum (pole *Publikovať* → *Ihneď* → zmeniť na
  konkrétny dátum a čas — takto vopred pripravíte oznamy 1–2 týždne dopredu a
  WordPress ich sám zverejní v správny čas, bez pluginu),
- vie ich filtrovať cez **kategórie** a **štítky** — to je náhrada za
  "filtrovanie/vyhľadávanie" bez vlastného kódu (pozri nižšie).

### Kategórie

| Kategória | Používa sa pre |
|---|---|
| `Oznamy` | Každý týždenný farský oznam ako samostatný príspevok |
| `Galéria` | Každý fotoalbum/udalosť ako samostatný príspevok s Gallery blokom |

### Štítky (tags) — pre filtrovanie galérie

Na každý príspevok v kategórii *Galéria* pridajte štítky podľa roka a typu
udalosti, napr. `2026`, `Veľká noc`, `birmovka`, `farská púť`. Návštevník
klikne na štítok (WordPress ho automaticky vykreslí ako odkaz) a dostane sa na
archívnu stránku so všetkými albumami s daným štítkom — to je natívne
"filtrovanie" bez JavaScriptu či pluginu.

### Vyhľadávanie

Vložte natívny **Search blok** (Vložiť blok → "Vyhľadávanie") do hlavičky
alebo na stránku Galéria/Oznamy — prehľadáva nadpisy aj text príspevkov,
funguje na bezplatnom pláne bez akéhokoľvek nastavenia.

## Používatelia a role (natívne role WordPressu)

| Rola | Kto | Oprávnenia |
|---|---|---|
| **Administrator** | Farár / správca webu | Všetko vrátane nastavení, tém, používateľov |
| **Editor** | Kancelária farského úradu | Môže upravovať a publikovať všetky stránky aj príspevky (oznamy, galéria) |
| **Author** | Poverený laik/dobrovoľník na oznamy | Môže písať a publikovať **iba svoje vlastné** príspevky (typicky obmedzené na kategóriu Oznamy) |

Používatelia sa vytvárajú v **Users → Add New** priamo v administrácii
WordPressu (žiadny vlastný login systém netreba — presne to zodpovedá vášmu
zámeru "WordPress users").

## Mobilná čitateľnosť

Odporúčaná téma **Twenty Twenty-Four** je bloková (Full Site Editing), plne
responzívna a bez zbytočných ozdôb. Pre rozpis bohoslužieb používame Table
blok, ktorý sa na mobile automaticky horizontálne scrolluje/zalamuje — dôležité
je držať tabuľku na **3–4 stĺpce max** (Deň, Kostol, Čas, Poznámka), aby sa
zmestila aj na malých displejoch bez zmenšovania písma.
