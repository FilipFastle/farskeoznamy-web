# Použitie ako šablóna pre ďalšie farnosti

Keďže ide o bezplatný plán bez vlastného kódu, "šablóna" tu neznamená
inštalovateľný balík témy/pluginu (to by vyžadovalo vlastný kód — pozri
`obmedzenia-a-riesenia.md`), ale **opakovateľný postup**: každá farnosť si
založí vlastný samostatný web na WordPress.com a zopakuje rovnaké kroky.

## Postup pre novú farnosť

1. Založte nový, samostatný účet/web na WordPress.com (Free plán) —
   pozri `navod-nastavenie.md`, kroky 1–2.
2. Skopírujte obsah súborov z `docs/block-patterns/` do nového webu rovnakým
   spôsobom (Code editor → vložiť → Visual editor).
3. V každom skopírovanom bloku nahraďte zástupné texty (názov farnosti,
   adresa, mená kňazov, časy omší, kontakty) skutočnými údajmi danej farnosti.
4. Zopakujte kroky 3–10 z `navod-nastavenie.md` (stránky, kategórie, menu,
   prvý oznam, prvý album, kontaktný formulár, používatelia).
5. Aktivujte rovnakú tému (**Twenty Twenty-Four**) pre vizuálnu konzistenciu
   naprieč farnosťami, prípadne zvoľte inú farebnú paletu tej istej témy na
   odlíšenie.

## Čo zostáva rovnaké naprieč farnosťami

- Štruktúra stránok a poradie menu (`architektura-stranky.md`)
- Názvy kategórií (`Oznamy`, `Galéria`) a systém štítkov pre albumy
- Layout blokov (tabuľka rozpisu, štruktúra oznamu, štruktúra kontaktu)
- Odporúčaná téma a prístup k farbám/typografii

## Čo sa mení pre každú farnosť

- Texty, mená, adresy, kontakty, časy omší
- Fotografie a logá
- Konkrétna farebná paleta (v rámci možností zvolenej témy)
- Adresa webu (`nazovfarnosti.wordpress.com`)

## Ak by ste chceli skutočný inštalovateľný balík (jeden kód pre všetky farnosti)

To by vyžadovalo prechod na self-hosted WordPress.org alebo WordPress.com
Business plán a stavbu skutočného vlastného pluginu + témy (single knižnica
kódu, ktorú by každá farnosť len nainštalovala a nakonfigurovala cez
nastavenia, bez kopírovania blokov ručne). Táto cesta ostáva možná kedykoľvek
neskôr — viď `obmedzenia-a-riesenia.md`, posledná sekcia.
