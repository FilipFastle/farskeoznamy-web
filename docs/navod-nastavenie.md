# Návod: nastavenie farského webu na WordPress.com (Free)

## 1. Založenie webu

1. Choďte na [wordpress.com](https://wordpress.com) → **Start your website**.
2. Zvoľte adresu (na bezplatnom pláne dostanete `vasafarnost.wordpress.com`,
   vlastnú doménu bez prípony možno pripojiť len na plánoch od Premium vyššie).
3. Pri výbere plánu zvoľte **Free**.

## 2. Výber témy

1. **Appearance → Themes → Add New Theme**.
2. Zvoľte **Twenty Twenty-Four** (súčasť jadra WordPressu, bloková, zadarmo,
   moderná, veľmi dobrá čitateľnosť aj na mobile aj pre starších používateľov).
3. Aktivujte ju (**Activate**).
4. V **Appearance → Editor** (alebo Customize, podľa verzie) môžete zmeniť
   farebnú paletu a písmo cez vstavané štýly témy — bez vlastného CSS, ktoré na
   Free pláne nie je dostupné.

## 3. Vytvorenie stránok

**Pages → Add New Page** — vytvorte týchto 5 statických stránok:

1. Domov
2. Farnosť
3. Sviatosti
4. Bohoslužby
5. Kontakt

Pre každú z nich (okrem Domov, ktorá má vlastný layout — pozri
`block-patterns/uvodna-stranka.html`) použite zodpovedajúci súbor z
`docs/block-patterns/` presne podľa postupu v hlavnom [README](../README.md)
(**⋮ → Code editor** → vložiť → **⋮ → Visual editor**).

Nastavte **Domov** ako úvodnú stránku: **Settings → Reading → Your homepage
displays → A static page → Homepage: Domov**.

## 4. Kategórie pre Oznamy a Galériu

1. **Posts → Categories → Add New Category**.
2. Vytvorte kategóriu `Oznamy`.
3. Vytvorte kategóriu `Galéria`.
4. Zapamätajte si ich **ID** (pri kliknutí na kategóriu v zozname sa v adrese
   prehliadača zobrazí niečo ako `...tag_ID=7` — to číslo budete potrebovať pri
   filtrovaní podľa kategórie v bloku Latest Posts na Domovskej stránke).

## 5. Menu

**Appearance → Editor → Navigation** (alebo **Appearance → Menus** podľa
verzie editora) — pridajte v tomto poradí:

```
Domov · Farnosť · Sviatosti · Bohoslužby · Oznamy (odkaz na archív kategórie) · Galéria (odkaz na archív kategórie) · Kontakt
```

Odkaz na archív kategórie získate tak, že v **Posts → Categories** kliknete na
názov kategórie — skopírujte URL zo stránky, ktorá sa otvorí.

## 6. Prvý týždenný oznam

1. **Posts → Add New**.
2. Nadpis: napr. `Oznamy — 12. nedeľa v cezročnom období (19. 7. 2026)`.
3. Vpravo v paneli **Categories** zaškrtnite `Oznamy`.
4. Obsah vložte podľa `block-patterns/vzor-oznamov.html`.
5. Ak píšete oznamy dopredu (1–2 týždne vopred, ako ste spomenuli): v paneli
   **Publish** kliknite na **Immediately** a zmeňte na presný dátum a čas
   budúcej nedele → tlačidlo sa zmení na **Schedule**. WordPress príspevok
   zverejní automaticky presne v daný čas — nie je potrebný žiadny plugin.

## 7. Prvý fotoalbum

1. **Posts → Add New**.
2. Nadpis: napr. `Farská púť — október 2026`.
3. Kategória: `Galéria`.
4. Štítky (Tags): napr. `2026`, `púť`.
5. Obsah podľa `block-patterns/vzor-galeria-album.html`, fotky nahrajte cez
   **Vložiť blok → Gallery → Upload**.

## 8. Rozpis bohoslužieb

Na stránke **Bohoslužby** vložte obsah z `block-patterns/rozpis-bohosluzieb.html`
a upravte podľa vašich kostolov a časov. Sekciu "Zmeny a sviatky" na konci
stránky upravujte ručne pri každej zmene (sviatok, výnimka, letný/školský
rozpis) — je to najbližšie k dynamickému rozpisu, aké bezplatný plán umožňuje
(pozri `obmedzenia-a-riesenia.md` pre podrobnosti).

## 9. Kontaktný formulár

Vo WordPress.com editore vyhľadajte cez inserter blok **"Form"** (Jetpack
kontaktný formulár je na WordPress.com aktívny automaticky, nie je potrebná
inštalácia pluginu). Šablónu polí nájdete v `block-patterns/kontakt-a-info.html`.
Odoslané správy chodia na e-mail nastavený v nastaveniach formulára a zároveň
sa ukladajú do **Jetpack → Forms** v administrácii.

## 10. Používatelia

**Users → Add New** — vytvorte účty pre kanceláriu farského úradu (rola
`Editor`) a prípadne pre dobrovoľníka na oznamy (rola `Author`). Pozri
`architektura-stranky.md` pre vysvetlenie rolí.

## 11. Kontrola pred spustením

- [ ] Všetkých 5 stránok vytvorených a naplnených
- [ ] Menu obsahuje všetky položky v správnom poradí
- [ ] Kategórie `Oznamy` a `Galéria` vytvorené
- [ ] Aspoň jeden testovací oznam a jeden album publikovaný
- [ ] Rozpis bohoslužieb skontrolovaný na mobile aj počítači
- [ ] Kontaktný formulár odoslaný ako test a e-mail prišiel
- [ ] Nastavené používateľské účty pre farský úrad
