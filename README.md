# Farský web — WordPress.com (bezplatný plán)

Kompletný podklad na postavenie farského webu na **WordPress.com (Free plan)**
bez akéhokoľvek vlastného kódu (pluginy ani vlastné témy nie sú na bezplatnom
pláne možné — pozri [`docs/obmedzenia-a-riesenia.md`](docs/obmedzenia-a-riesenia.md)).

Namiesto vlastnej aplikácie tento repozitár obsahuje:

- **Architektúru stránky** — zoznam stránok, menu, kategórie/štítky —
  [`docs/architektura-stranky.md`](docs/architektura-stranky.md)
- **Návod krok za krokom** na nastavenie webu vo WordPress.com —
  [`docs/navod-nastavenie.md`](docs/navod-nastavenie.md)
- **Hotové bloky na vloženie** (rozpis bohoslužieb, vzor oznamov, kontakt,
  sviatosti, galéria, úvodná stránka) — priečinok
  [`docs/block-patterns/`](docs/block-patterns/)
- **Prehľad obmedzení bezplatného plánu** a ako sa im čo najviac priblížiť
  natívnymi nástrojmi WordPressu —
  [`docs/obmedzenia-a-riesenia.md`](docs/obmedzenia-a-riesenia.md)
- **Postup pre ďalšie farnosti** (tento web ako opakovateľná šablóna) —
  [`docs/sablona-pre-viac-farnosti.md`](docs/sablona-pre-viac-farnosti.md)

## Ako použiť bloky z `docs/block-patterns/`

Každý súbor `.html` obsahuje skutočný Gutenberg blokový kód (nie bežné HTML).
Vo WordPress editore stránky/príspevku:

1. Kliknite na **⋮ (tri bodky vpravo hore) → Code editor**.
2. Vymažte obsah a vložte celý obsah príslušného `.html` súboru.
3. Znova kliknite **⋮ → Visual editor** — bloky sa vykreslia ako bežné bloky,
   ktoré môžete ďalej upravovať myšou.

Toto je natívna funkcia WordPressu (funguje aj na bezplatnom pláne, nie je to
plugin). Farby a niektoré štýly závisia od zvolenej témy — odporúčaná téma je
**Twenty Twenty-Four** (bloková, moderná, dobre čitateľná, súčasť jadra
WordPressu, funguje aj zdarma).

⚠️ Blokový kód v tomto repozitári nebol overený na živom WordPress inštalácii
(sieťové obmedzenia tohto prostredia neumožnili spustiť lokálny WordPress na
otestovanie) — je napísaný podľa štandardnej Gutenberg syntaxe, ale po vložení
si vždy prekontrolujte vizuálny náhľad pred publikovaním.

---

© 2026 Filip Stašek
