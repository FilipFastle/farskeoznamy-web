# Obmedzenia bezplatného plánu WordPress.com a riešenia

Toto je úprimný zoznam toho, čo z pôvodného zadania **nie je** na bezplatnom
pláne dosiahnuteľné, a čo namiesto toho reálne funguje.

| Pôvodná požiadavka | Na Free pláne nejde, pretože... | Čo sa dá spraviť namiesto toho |
|---|---|---|
| Vlastný admin panel (formuláre, D1/databáza) | Free plán nepovoľuje žiadne vlastné pluginy ani kód | Natívna administrácia WordPressu (Posts/Pages) plní rovnakú úlohu — netreba nič programovať, no rozhranie je štandardné WP administrátorské rozhranie, nie na mieru |
| TinyMCE Extended / rozšírený editor | Pluginy nie sú na Free pláne povolené vôbec | Vstavaný blokový editor (Gutenberg) — pokrýva tučné/kurzíva, nadpisy, zoznamy, tabuľky, odkazy, farby textu v rámci povolených blokov. Chýbajú pokročilé funkcie ako vlastné TinyMCE tlačidlá |
| Vlastné CSS / vlastný dizajn nad rámec témy | "Vlastné CSS" (Custom CSS) je funkcia až od plánu Premium/Business | Voľba farieb/písma len cez vstavané štýly zvolenej blokovej témy (Twenty Twenty-Four ponúka niekoľko farebných paliet) |
| Dynamické filtrovanie galérie (klik na filter → JS prefiltruje bez reloadu) | Vyžaduje vlastný JavaScript/plugin | Kategórie a štítky s natívnymi archívnymi stránkami — návštevník klikne na štítok/rok a dostane podstránku len s tými albumami. Nie je to "live filter" bez načítania stránky, ale funkčne rieši rovnaký cieľ |
| Automatická sezónna zmena rozpisu bohoslužieb (napr. leto vs. školský rok) podľa dátumu | Vyžaduje logiku/plugin | Ručná úprava tabuľky rozpisu pri zmene sezóny — dobre štruktúrovaná stránka to robí rýchlym (pozri `block-patterns/rozpis-bohosluzieb.html`) |
| Vlastné role/oprávnenia nad rámec WP | Vlastné role vyžadujú plugin | Natívne role WordPressu (Administrator/Editor/Author/Contributor) pokrývajú bežné scenáre farského úradu |
| Vlastná doména | Vlastná doména bez WordPress.com prípony vyžaduje aspoň plán Personal (najlacnejší platený) | Zatiaľ `vasafarnost.wordpress.com`; keď bude k dispozícii rozpočet/doména, upgrade na Personal/Premium ju pripojí bez zmeny obsahu |

## Čo sa reálne podarí bez akéhokoľvek kódu

- Týždenné/aj dopredu naplánované oznamy (natívne plánovanie príspevkov)
- Prehľadný, mobilne čitateľný rozpis bohoslužieb (Table blok)
- Fotoalbumy s vyhľadávaním podľa roka/udalosti (kategórie + štítky + Search
  blok)
- Kontaktný formulár s notifikáciou na e-mail (Jetpack Form blok, súčasť
  WordPress.com zdarma)
- Viacero používateľov s rôznymi oprávneniami (natívne role WP)
- Responzívny, čistý dizajn vhodný aj pre starších používateľov (Twenty
  Twenty-Four téma)

## Ak sa neskôr rozhodnete pre viac možností

Prechod na **self-hosted WordPress.org** (vlastný hosting, cena rádovo pár
eur/mesiac) alebo **WordPress.com Business plán** by odomkol presne tie
položky vyššie označené ako nedosiahnuteľné — vtedy by dávalo zmysel postaviť
skutočný vlastný plugin (custom post types pre omše/oznamy/galériu s
opakovaním a sviatkami) namiesto ručných úprav. Táto možnosť ostáva otvorená
kedykoľvek v budúcnosti bez straty obsahu — príspevky a stránky sa dajú
exportovať (**Tools → Export**) a naimportovať na nový self-hosted web.
