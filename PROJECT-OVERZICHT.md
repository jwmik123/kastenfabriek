# Kastenfabriek — Projectoverzicht

Volledige documentatie van de applicatie: functionaliteit, opties, prijzen, kleuren, fonts, paginastructuur en techniek.

**Peildatum:** 21 augustus 2026 · **Branch:** `main` · **Sanity dataset:** `production` (project `ai3vrh8e`)

---

## Inhoud

1. [Stack & architectuur](#1-stack--architectuur)
2. [Paginastructuur (route tree)](#2-paginastructuur-route-tree)
3. [Design system — kleuren, fonts, componenten](#3-design-system--kleuren-fonts-componenten)
4. [Configurator — gedeelde basis](#4-configurator--gedeelde-basis)
5. [Kledingkast-configurator](#5-kledingkast-configurator)
6. [Wasmachinekast-configurator](#6-wasmachinekast-configurator)
7. [Materialen & kleuren (kastafwerking)](#7-materialen--kleuren-kastafwerking)
8. [Handgrepen & metaalafwerkingen](#8-handgrepen--metaalafwerkingen)
9. [Prijsmodel — alle actuele bedragen](#9-prijsmodel--alle-actuele-bedragen)
10. [Webshop-producten (PAX & stalen)](#10-webshop-producten-pax--stalen)
11. [Winkelwagen, wishlist, checkout & bestellingen](#11-winkelwagen-wishlist-checkout--bestellingen)
12. [E-mails & order-documenten](#12-e-mails--order-documenten)
13. [Account & authenticatie](#13-account--authenticatie)
14. [Kennisbank](#14-kennisbank)
15. [Sanity CMS — alle documenttypes](#15-sanity-cms--alle-documenttypes)
16. [Database (PostgreSQL / Drizzle)](#16-database-postgresql--drizzle)
17. [3D-scene & assets](#17-3d-scene--assets)
18. [Environment variables](#18-environment-variables)
19. [Scripts & commando's](#19-scripts--commandos)
20. [Teststatus & openstaande punten](#20-teststatus--openstaande-punten)

---

## 1. Stack & architectuur

| Onderdeel | Keuze |
|---|---|
| Framework | Next.js 16.1.1 (App Router, React 19.2.3, TypeScript 5) |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) + shadcn/ui + Radix (`radix-ui`) |
| 3D | Three.js 0.182 · `@react-three/fiber` 9 · `@react-three/drei` 10 · `@react-three/postprocessing` · WebGPU-renderer met WebGL-fallback |
| State | Zustand 5 (één store per configurator) |
| CMS | Sanity v4 (`next-sanity`), Studio embedded op `/studio`, NL-locale |
| Database | PostgreSQL via Drizzle ORM 0.45 (`postgres` driver) |
| Auth | Better Auth 1.4 (e-mail/wachtwoord + Google OAuth) |
| Betalen | Stripe 20 (Checkout Session + webhook) |
| E-mail | Resend + React Email; PDF via `@react-pdf/renderer` |
| Animatie | GSAP 3 (+ ScrollTrigger, SplitText), Lenis smooth scroll |
| Video | Mux (`@mux/mux-player-react`) voor de hero |
| Tests | Vitest 4 (54 testbestanden, 656 tests) |

**Route groups**

- `app/(main)` — publieke website: navigatie + footer + Lenis smooth scroll + intro-animatie.
- `app/(configurator)` — 3D-configurators. **Alleen `{children}`**: geen Navigation, geen Footer, `LockViewport` zet html/body op `100dvh` zodat alleen de step-wizard scrollt.
- `app/(studio)` — Sanity Studio, kale layout.
- `app/api` — auth-handler, sign-out, Stripe-webhook.

**Route-bescherming** (`proxy.ts`): `/account/*` vereist sessie (redirect naar `/login?callbackUrl=…`); ingelogde gebruikers worden op `/login` en `/register` naar `/account` gestuurd.

---

## 2. Paginastructuur (route tree)

```
/                                   Homepage
├── /ontwerp-je-kast                Overzicht configurators + stalenbanner
├── /kledingkast                    Kledingkast-configurator (3D)
│   └── ?edit=<cartItemId>          Bestaande winkelwagenregel bewerken
├── /wasmachinekast                 Wasmachinekast-configurator (3D)
│   └── ?edit=<cartItemId>
├── /producten                      Webshop-overzicht
│   └── /producten/[slug]           Productdetail
│       ├── ikea-pax-deur           PAX-deurconfigurator
│       └── materiaalstalen         Gratis stalen aanvragen
├── /kennisbank                     Kennisbank met filters (?type=&categorie=&q=)
│   └── /kennisbank/[slug]          Artikel / video / PDF
├── /cart                           Winkelwagen
├── /checkout                       Afrekenen (login vereist)
├── /order/[id]                     Bestelbevestiging (login vereist)
├── /wishlist                       Verlanglijst
├── /login                          Inloggen (e-mail of Google)
├── /register                       Registreren
├── /account                        Accountdashboard
│   ├── /account/orders             Bestelgeschiedenis
│   ├── /account/wishlist           Opgeslagen ontwerpen
│   └── /account/addresses          Adresboek
├── /studio                         Sanity Studio (CMS)
└── /api
    ├── /api/auth/[...all]          Better Auth handler
    ├── /api/auth/sign-out
    └── /api/webhooks/stripe        Stripe checkout.session.completed
```

### Homepage-secties (op volgorde)

1. **Hero** — Mux-achtergrondvideo (loop, muted), titel *"Kasten die precies passen."*, CTA-knop "Ontwerp je kast" met geanimeerde sweep/pijl.
2. **Promo-strip** — amber balk: *gratis montage, tot €2160,- korting*.
3. **ProductOptionsSection** — "Waar ben je naar op zoek?": Kledingkast · Wasmachinekast · IKEA PAX Deuren, plus kaart "Bekijk al onze producten".
4. **ModulesScrollSection** — 7680×1080 panoramabeeld met GSAP-ScrollTrigger; overlays o.a. "Planken & opbergruimte".
5. **HotspotSection** — interactieve kastdetails; content uit Sanity (`hotspotSection`), met ingebouwde fallback-copy.
6. **MaterialsSection** — alle kleuren + fineren als swatches, klik = lightbox met link naar stalen bestellen.
7. **WerkwijzeSection** — 4 stappen met stickfigure-illustraties: 01 Ontwerp je kast · 02 Productie op maat · 03 Levering · 04 (montage).
8. **TestimonialSection** — klantbeoordelingen uit Sanity (5 aanwezig), slider.

Boven alles: **navigatiebalk** met promo-strip (*"Alle kasten nu met gratis montage bij oplevering!"*).

### Navigatie

- Hoofdlinks: Home · Kasten (`/ontwerp-je-kast`) · Producten · Kennisbank
- Icoonlinks: Wishlist · Winkelwagen · Account
- Desktop: frosted-glass pill met GSAP-sliding highlight; logo in `mix-blend-difference`
- Mobiel: fullscreen menu met `clipPath: circle()` GSAP-animatie

### Footer

Vier kolommen — Navigatie · Onze Kasten · Contact · Betaalmethoden (iDEAL, Visa, Mastercard, PayPal). Slogan: *"Maatwerk dat niet alleen opbergt, maar ook sfeer brengt."* Contact: `info@kasten-fabriek.nl`, +31 6 1234 5678, Amsterdam.

> ⚠️ Footer bevat links naar `/about`, `/projects` en `/ikea-pax` — deze routes bestaan **niet** in de app (404). Zie [§20](#20-teststatus--openstaande-punten).

---

## 3. Design system — kleuren, fonts, componenten

### Kleurenpalet (`app/globals.css`)

| Token | Waarde | Gebruik |
|---|---|---|
| `--primary` / `--color-primary` | `#34463A` | Donkergroen — hoofdkleur, knoppen, footer, promo-strip |
| `--color-primary-50` | `#f8fbfb` | |
| `--color-primary-100` | `#f3f6f6` | |
| `--color-primary-200` | `#e2e9e3` | Services-balk achtergrond |
| `--color-primary-300` | `#ced9d0` | |
| `--color-primary-400` | `#97af9d` | |
| `--color-primary-500` | `#64806b` | Nav-hover-highlight |
| `--color-primary-600` | `#485d51` | |
| `--color-primary-800` | `#212c21` | |
| `--color-primary-900` | `#141f16` | |
| `--color-primary-950` | `#070e08` | |
| `--color-secondary` | `#aa382b` | Terracotta accent (eyebrows) |

**Losse achtergrondkleuren in gebruik:** `#f1ede4` (zand — ontwerp-je-kast, mobiele nav), `#f2ede4` (kennisbank, materialensectie), `#1b211c` (tekst op zand), `amber-500` (promo), `amber-50/200/800` (waarschuwingen).

**shadcn-tokens** (oklch): `--background`, `--foreground`, `--card`, `--popover`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--chart-1…5`, `--sidebar-*`. Volledige `.dark`-set is gedefinieerd, maar **dark mode staat uit** (`prefers-color-scheme`-block is uitgecommentarieerd).

**Radius:** `--radius: 0.625rem`, afgeleiden `sm` t/m `4xl`.

### Typografie

| Font | CSS-variabele | Gewichten | Gebruik |
|---|---|---|---|
| **Poppins** (Google) | `--font-poppins` | 400, 500, 600, 700 | Alle koppen (`h1–h4`, `font-weight:600`, `letter-spacing:-0.025em`, `line-height:1.1`), site-brede `font-poppins`-klasse |
| **Geist Sans** | `--font-geist-sans` | variabel | Basis-sans |
| **Geist Mono** | `--font-geist-mono` | variabel | Mono |
| **IBM Plex Mono** | `--font-plex-mono` | 400, 500 | Eyebrows/kickers op `/producten` |

Taal: `<html lang="nl">`. Prijzen: `Intl.NumberFormat('nl-NL', { currency: 'EUR', maximumFractionDigits: 0 })`.

### Custom utilities

- `.scrollbar-primary` — dunne scrollbar in primary-kleur (4px)
- `.scrollbar-hidden` — native scrollbar verbergen
- `.text-line-mask` — clipping voor GSAP SplitText-regels
- `.hero-btn` — hover-animaties (tekst-shift, roterende icon-bg, pijl-slide, sweep)
- `.configurator-container` — responsieve hoogte (68vw ≥1025px, 50vw ≥1440px)

### UI-componenten (`components/ui/`)

`SegmentedControl` · `Toggle` · `badge` · `button` · `separator` · `slider` · `tooltip` (TooltipProvider met 400ms delay, globaal in root layout).

### SEO / metadata

- Titel-template: `%s | Kastenfabriek`, default *"Kastenfabriek — kasten op maat, tot de millimeter"*
- OG/Twitter: `summary_large_image`, `/og/kastenfabriek.jpg` (1200×630), locale `nl_NL`
- `metadataBase` uit `NEXT_PUBLIC_SITE_URL` (fallback `https://kasten-fabriek.nl`)
- Per pagina eigen metadata; productpagina's gebruiken de producthero als OG-afbeelding

---

## 4. Configurator — gedeelde basis

Beide configurators delen `app/(configurator)/_shared/`.

### Layout

- **Desktop (`lg`)**: 3D-canvas links (flex-1) + step-wizard rechts (vaste 420px)
- **Tablet/mobiel**: canvas boven (40svh mobiel / 50vh md), wizard eronder
- **Top bar** (desktop): terugknop naar `/ontwerp-je-kast`, stap-indicator, iconen wishlist/cart/account
- **Mobile header**: productnaam + live prijs
- `MobileDesktopNotice` — melding dat desktop de beste ervaring geeft

### Canvas-toolbar (zwevend over de 3D-scene)

| Knop | Functie |
|---|---|
| Inzoomen / Uitzoomen | `userZoom` 0–1 (default 0.5) |
| Afmetingen tonen | Maatvoeringsoverlay aan/uit |
| Deuren openen/sluiten | `doorsOpen` (default: open) |
| Willekeurige indeling | `randomFill()` — vult alle modules willekeurig |

### Overige gedeelde functionaliteit

- **Prijspaneel** (`CanvasPricePanel`) — live totaalprijs over het canvas
- **Modulepopover** — klik op een module in 3D → popover op de klikpositie (`popoverPlacement`)
- **Per-module materiaalpaneel** — buiten-/binnenkant per module overschrijven
- **Rondleiding** (`@reactour/tour`): 4 stappen — Bedieningsbalk → Bekijk je kast → Pas modules aan → Volgende stap. Status in localStorage; help-knop om opnieuw te starten.
- **Services-balk** — Optionele Inmeetservice · Optionele Montageservice
- **Colorway-preview** + **samenvattingssectie** onder de configurator (alleen desktop)
- **Autosave**: concept in localStorage onder `kf-config-draft-<product>`; wordt hersteld bij terugkomst
- **Screenshots**: bij toevoegen aan winkelwagen worden twee canvas-captures gemaakt (deuren dicht + open) en meegestuurd naar cart/order/e-mail
- **Prestatie**: `devicePower`-detectie, `CanvasFreezeGuard`, `WebGPURenderGuard`, `r3f-webgpu-perf`

---

## 5. Kledingkast-configurator

**Route:** `/kledingkast` · **Store:** `app/(configurator)/kledingkast/store.ts`

### Wizard — 5 stappen

| # | Stap | Inhoud |
|---|---|---|
| 1 | **Afmetingen** | Plaatsingstype, breedte/hoogte/diepte, schuine wanden |
| 2 | **Indeling** | Aantal modules, per module een layout, deur ja/nee, dubbele breedte |
| 3 | **Materiaal** | Buitenkant / binnenkant (tabs) + per-module overschrijven |
| 4 | **Handgrepen** | Greep kiezen + metaalafwerking |
| 5 | **Accessoires** | LED, zijpanelen-dikte, stekkerdozen |

### Stap 1 — Afmetingen

- **Plaatsingstype**: `ingebouwd` (default, schuintes mogelijk) of `vrijstaand` (schuintes geforceerd uit)
- **Breedte**: 30–520 cm (min `singleCorpus.minWidth`, max `maxWidth × 8 modules`)
- **Hoogte**: 200–385 cm (`maxHeight 275` + `topCabinet.maxHeight 110`)
- **Diepte**: 30–90 cm
- **Defaults**: 180 × 240 × 60 cm, 3 modules
- **Opzetkast**: automatisch bij hoogte > 275 cm. Hoofdkast wordt dan 225 cm, opzetkast = hoogte − 225 − 1,5 cm. Zijwanden steken altijd 15 mm boven het interieur uit (`SIDE_WALL_EXTRA_CM = 1.5`).

**Schuintes (schuinte / slope)** — alleen bij `ingebouwd`:

- `diagonalSide`: `none` (default) · `left` · `right` · `both`
- Per zijde: **starthoogte** (default 180 cm) en **topbreedte** (default 50 cm); ranges worden dynamisch geclamped op basis van kastbreedte en modulecount (`diagonalConstraints.ts`)
- **Achterwand schuin** (`backDiagonal`): knikhoogte 40 cm – (hoofdhoogte − 20), vlakke sectie 0 – (diepte − 10). Sluit zijschuintes uit en vice versa.
- Zijschuinte forceert zijpanelen terug naar 18 mm (36 mm is niet combineerbaar)
- Modules met `span: 2` onder een schuinte worden automatisch teruggezet naar `span: 1`

### Stap 2 — Indeling

- Aantal modules: `ceil(breedte / 65)` t/m `floor(breedte / 30)`
- Per module: **layout kiezen**, **deur aan/uit**, **span 1 of 2** (één brede deur over twee modules; alleen bij volle hoogte)
- Modulebreedte-grenzen: 30–65 cm (`singleCorpus`)

**Module-layouts (kledingkast)** — geometrie in `scene/moduleLayouts.ts`, prijzen in Sanity:

| ID | Naam | Omschrijving | Min. hoogte | 3D-model |
|---|---|---|---|---|
| 1 | Full shelves | Alleen planken, gelijkmatig verdeeld | — | (gegenereerd) |
| 2 | Drawers + shelves | Laden onderin, planken erboven | 0,70 m | `DrawerModule.glb` |
| 3 | Double Rod | Twee roeden boven elkaar | 1,20 m | `RodModule.glb` ×2 |
| 4 | Split + shelves | Split-vak onderin, planken erboven | 1,472 m | `SplitModule.glb` |
| 5 | Single Rod 140 | Roede op 140 cm, planken erboven | 1,472 m | `RodModule.glb` |
| 6 | Rod + plank | Roede 35 cm onder plafond, plank op 35 cm | 0,736 m | `RodModule.glb` |
| 7 | Drawer + rod | Laden onderin, roede onder plafond | 1,20 m | `DrawerModule.glb` + `RodModule.glb` |
| 8 | Desk | Bureau onderin, planken vanaf 175 cm | 1,84 m | `DeskModule.glb` |

**Plankenlogica:** standaard tussenafstand `SHELF_SPACING = 0.368 m`, plankdikte 18 mm, minimale kopruimte 30 cm (anders vervalt de bovenste plank).

### Stap 3 — Materiaal

Tabs **Buitenkant** / **Binnenkant**. Fineren zijn zowel buiten als binnen beschikbaar; vijf kleuren zijn **outside-only**. Per module kan een afwijkend materiaal worden gekozen (kleurenwiel + swatch-grid). Een fineer-buitenkant maakt de deur automatisch een `veneer`-deur (duurdere variant).

### Stap 4 — Handgrepen

Grid met 37 grepen (gepagineerd) + optie **Greeploos (push-to-open)**. Daaronder de **Afwerking**-swatches; alleen de metalen die de gekozen greep toestaat (`allowedMaterials`) zijn selecteerbaar. Leren grepen (H3121/H3161) hebben een eigen `bodyColor`.

Default: greep-id `23` (W7845), afwerking `chrome`.

### Stap 5 — Accessoires

- **LED-lichtstrips** — warm wit, 10 cm van de voorzijde in de zijwanden. Toont netstroom-waarschuwing uit Sanity: *"Let op: er moet netstroom achter de kast aanwezig zijn."*
- **Zijpanelen** — 18 mm (standaard) of 36 mm (betaalde upgrade, geblokkeerd bij schuine wand)
- **Stekkerdoos** — per module aan/uit via een gridknop (max 8 kolommen), zelfde netstroom-melding

### Overige kledingkast-features

- `doorsExtendToFloor` — deuren tot de vloer
- `sidePanelThickness` — 18 mm / 36 mm
- Onderstel/plint (`OnderstelPlinth`), kamerwanden (`RoomWalls`), silhouetvlak, structurele knikplanken bij schuintes
- Maatvoering: `Measurements.tsx` + `diagonalSegments` / `rodMeasurements`

---

## 6. Wasmachinekast-configurator

**Route:** `/wasmachinekast` · **Store:** `app/(configurator)/wasmachinekast/store.ts`

Verschil met de kledingkast: de kast kan uit **twee secties** bestaan, elk met een eigen corpus. **Geen schuintes.**

### Wizard — 6 stappen

| # | Stap |
|---|---|
| 1 | **Indeling (layout)** — sectieopstelling kiezen |
| 2 | **Afmetingen** |
| 3 | **Modules** |
| 4 | **Materiaal** (incl. werkblad) |
| 5 | **Handgrepen** (deuren + ladefronten apart) |
| 6 | **Accessoires** |

### Stap 1 — Layout

| Waarde | Label | Omschrijving |
|---|---|---|
| `high-only` | Alleen hoge kast | Eén kast op volle hoogte (**default**) |
| `low-only` | Alleen lage kast | 90 cm kast met werkblad |
| `low-left` | Lage links + hoge rechts | Combinatie van twee kasten |
| `low-right` | Hoge links + lage rechts | Combinatie van twee kasten |

Spiegelen (`low-left ↔ low-right`) behoudt beide secties; een sectie verwijderen vraagt om bevestiging.

### Secties

- **Hoge kast** — 200–275 cm (+ opzetkast tot 110 cm), zelfde constraints als de kledingkast
- **Lage kast** — vaste hoogte **90 cm**, default 2 modules, standaardbreedte gelijk aan de hoge sectie (fallback 120 cm)
- **Diepte is gedeeld** tussen secties: minimaal **75 cm** (`WASM_MIN_DEPTH_CM`), maximaal 90 cm. Default 85 cm.
- **Defaults**: breedte 120, hoogte 240, diepte 85, 2 modules, layout `high-only`

### Werkblad (countertop)

Het werkblad **is** het dak van de lage kast (geen losse plaat erbovenop), vlak met het corpus, geen overstek. Altijd aanwezig op een lage kast.

- **Dikte**: 18 mm of 36 mm — *geen prijsverschil*
- **Materiaal**: apart te kiezen (`countertopMaterialId`) uit dezelfde materialencatalogus; default = buitenkantmateriaal

### Module-layouts (wasmachinekast)

**Hoge sectie — wasmachinemodules** (min. slotbreedte 68,6 cm):

| ID | Naam | Omschrijving | GLB | Ladefronten |
|---|---|---|---|---|
| 11 | Machine met 1 lade | 1 wasmachine | `ModuleWasherSingle.glb` | 1 |
| 13 | Machine met 2 lades | 2 wasmachines in één kast | `ModuleWasherDouble.glb` | 2 |
| 14 | Wasmachine met plank | Machine met plank erboven | `ModuleWasherPlank.glb` | 2 |

**Lage sectie** (`sectionType: 'low'`, keukenstijl-fronten, geen deuren):

| ID | Naam | Omschrijving | GLB | Ladefronten |
|---|---|---|---|---|
| 20 | Lage kast — plank | Twee ladefronten, vaste plank erachter | `12_WMPlankLow.glb` | 2 |
| 21 | Lage kast — enkel vak | Eén groot ladefront over de volle hoogte | `13_WMSingleLow.glb` | 1 |
| 22 | Lage kast — dubbel vak | Twee losse vakken, elk eigen front en bodem | `14_WMDoubleLow.glb` | 2 |
| 23 | Wasmachine (lage kast) | Open nis onder werkblad, geen front | `WMWasherOnlyLow.glb` | 0 (floor-mount) |

Daarnaast zijn de generieke layouts 1 en 2 (`sectionType: 'both'`) in beide secties beschikbaar. `sectionType` filtert wat waar kiesbaar is (`wasmModuleLayoutFilter.ts`).

### Wasmachineplaatsing

- Wasmachines mogen in **beide** secties tegelijk staan; elke plaatsing draagt zijn eigen `section` (`WasherPlacement`)
- Een wasmachineslot heeft een **vaste breedte**; overige slots delen de resterende ruimte (`fitVariableSlotCount`). Past het niet meer, dan worden achterste modules automatisch verwijderd — of de plaatsing wordt geweigerd
- Lades onder de wasmachine krijgen grepen (`drawerFrontCount`)

### Handgrepen (stap 5)

Twee aparte keuzes:
- **Deurgreep** (`doorHandleId`) — voor gewone deuren
- **Ladefrontgreep** (`drawerHandleId`) — voor lage-kastfronten; default `'none'` (push-to-open)

Grepen met `fitsLowModule: false` worden geblokkeerd op lage modules; `noRotationOnDrawer: true` houdt de greep rechtop op een ladefront.

### Accessoires (stap 6)

Zelfde als kledingkast, met filtering: accessoires met `availableForLowSection: false` verdwijnen bij `low-only` (en aanwezige stekkerdozen worden gewist met een melding, `lowOnlyAccessoryNotice`).

### Migratie van oude configuraties

`wasmSnapshotMigration.ts` leest snapshots van vóór het sectiemodel: ontbrekende `layout` → `high-only`, top-level breedte/hoogte/modules worden als hoge sectie geïnterpreteerd, legacy `washerSection` wordt naar per-plaatsing `section` vertaald.

---

## 7. Materialen & kleuren (kastafwerking)

Bron: `app/(configurator)/kledingkast/materials.ts` (19 materialen).

### Fineren / texturen (buiten én binnen)

| ID | Naam | Textuur |
|---|---|---|
| `h1199-thermo-eik` | Thermo Eik Zwartbruin | H1199 ST12 |
| `h3165-vicenza-eik-licht` | Vicenza Eik Licht | H3165 ST12 |
| `h3158-vicenza-eik-grijs` | Vicenza Eik Grijs | H3158 ST19 |
| `h1714-lincoln-notelaar` | Lincoln Notelaar | H1714 ST19 |
| `h3190-fineline-antraciet` | Fineline Metallic Antraciet | H3190 ST19 |

Fineren worden gerenderd met **triplanar mapping** (`_shared/materials/triplanar.ts`, registry `veneers.ts`); optionele normal-/roughness-maps zijn voorbereid maar nog niet geleverd.

### Kleuren — buiten én binnen

| ID | Naam | Hex |
|---|---|---|
| `zwart` | Zwart | `#050407` |
| `premium-wit` | Premium Wit | `#FBFDF5` |
| `zandbeige` | Zandbeige | `#E7D6C2` |
| `eucalyptus-groen` | Eucalyptus Groen | `#747F74` |
| `amandelbeige` | Amandelbeige | `#B6A294` |
| `truffelbruin` | Truffelbruin | `#685A51` |
| `donkertaupe` | Donkertaupe | `#90877A` |
| `koolstofgrijs` | Koolstofgrijs | `#36383E` |
| `mistblauw` | Mistblauw | `#556F84` |

### Kleuren — alleen buitenkant

| ID | Naam | Hex |
|---|---|---|
| `cosmosblauw` | Cosmosblauw | `#122744` |
| `granaatappelrood` | Granaatappelrood | `#5f1e22` |
| `pistachegroen` | Pistachegroen | `#c8d2c1` |
| `olijfgroen` | Olijfgroen | `#9b9971` |
| `steengroen` | Steengroen | `#526261` |

**Default:** buiten- én binnenkant `premium-wit`.

Elk materiaal heeft twee sfeerfoto's in `/public/colorways/<slug>-1.webp` en `-2.webp` (38 bestanden) voor de colorway-preview onder de configurator.

---

## 8. Handgrepen & metaalafwerkingen

### Grepen — 37 documenten in Sanity, alle **€35**

Productcodes: `W4080` (6 varianten), `W7822` (2), `W7840` (3), `W7871` (1), `W7870` (2), `W7988` (4), `Z1080` (3), `Z7849` (1), `W7845` (1 — **default, id 23**), `Z0056` (4), `Z2168` (2), `H3121` (5 leren varianten: grijs, beige, roze, zwart, bruin), `H3161` (4 leren varianten: naturel, bruin, zwart).

Per greep:
- `allowedMaterials` — welke metalen toegestaan zijn
- `fitsLowModule` — `false` = past niet op een ladefront/lage module (ids 3, 4, 5, 6, 11, 17, 18, 21, 26, 27, 30)
- `noRotationOnDrawer` — `true` bij alle leren grepen: blijft rechtop op een lade
- `bodyColor` — leerkleur bij H3121/H3161

**Alternatief:** *Greeploos (push-to-open)* — €7,50 per deur.

### Metaalafwerkingen (12, PBR-waarden in `handleMaterials.ts`)

| ID | Label | Swatch | Metalness / Roughness |
|---|---|---|---|
| `chrome` | Chrome (**default**) | `#d3d3d3` | 0.9 / 0.2 + clearcoat 1 |
| `black` | Zwart | `#1a1a1a` | 0.9 / 0.35 |
| `brass` | Messing | `#c9a84c` | 0.9 / 0.3 |
| `copper` | Koper | `#b87333` | 0.9 / 0.3 |
| `rose-gold` | Rosé goud | `#c98c7a` | 0.9 / 0.3 |
| `silver` | Zilver | `#c0c0c0` | 0.95 / 0.18 + clearcoat 0.6 |
| `old-silver` | Oud zilver | `#9a9690` | 0.85 / 0.55 |
| `stainless` | RVS look | `#c8ccd0` | 0.9 / 0.35 |
| `aluminium` | Aluminium | `#a8adb3` | 0.7 / 0.4 |
| `gray-blue` | Grijsblauw | `#5d6e7a` | 0.85 / 0.4 |
| `gray` | Grijs | `#7a7a7a` | 0.85 / 0.45 |
| `white` | Wit | `#ececec` | 0.5 / 0.45 + clearcoat 0.4 |

### Leerkleuren (5)

`leather-pink` Huidskleur roze `#e6b8a8` · `leather-beige` Beige `#c8a884` · `leather-brown` Bruin `#6b4423` · `leather-light-gray` Lichtgrijs `#a8a8a8` · `leather-black` Zwart `#1a1a1a`

---

## 9. Prijsmodel — alle actuele bedragen

Alle prijzen komen live uit Sanity (`pricingConfig` + losse documenten). Onderstaande waarden zijn de **actuele productiewaarden**.

### Basisconfiguratie

| Item | Waarde |
|---|---|
| Valuta | EUR |
| Bezorgkosten | **€95** (vast, één keer per bestelling) |
| LED — basisprijs | **€180** |
| LED — per module | **€65** |
| Toeslag schuine achterwand | **€1.100** |
| Toeslag schuine zijwand (per zijde) | **€1.100** (beide zijden = €2.200) |
| Gratis montage-actie | **uit** (`freeMontage: false`) |

### Afmetingsgrenzen (`constraints`)

| | Enkel (module) | Dubbel (module) | Opzetkast |
|---|---|---|---|
| Breedte | 30 – 65 cm | 65 – 120 cm | — |
| Hoogte | 200 – 275 cm | 200 – 275 cm | max 110 cm |
| Diepte | 30 – 90 cm | 15 – 90 cm | — |

> Let op de historische naamgeving: `singleCorpus`/`doubleCorpus` begrenzen in de praktijk een **module**, niet het corpus. Niet hernoemen zonder Sanity-migratie.

### Module-layoutprijzen

| ID | Naam | Enkel | Dubbel | Sectie |
|---|---|---|---|---|
| 1 | Full shelves | €342 | €570 | both |
| 2 | Drawers + shelves | €680 | €880 | both |
| 3 | Double Rod | €687 | €1.145 | high |
| 4 | Split + shelves | €456 | €760 | high |
| 5 | Single Rod 140 | €774 | €1.290 | high |
| 6 | Rod + plank | €408 | €680 | high |
| 7 | Drawer + rod | €735 | €935 | high |
| 8 | Desk | €654 | €1.090 | high |
| 11 | Machine met 1 lade | €1.250 | €1.250 | high |
| 13 | Machine met 2 lades | €1.244 | €1.250 | high |
| 14 | Wasmachine met plank | €1.250 | €1.250 | high |
| 20 | Lage kast — plank | €850 | €850 | low |
| 21 | Lage kast — enkel vak | €850 | €850 | low |
| 22 | Lage kast — dubbel vak | €850 | €850 | low |
| 23 | Wasmachine (lage kast) | €850 | €850 | low |

Alleen layout 1 is `availableForTopCabinet: true`.

> Een layout zonder Sanity-document kost €0 en logt één keer een console-fout (`[pricing] Module layout X has no moduleLayout document`).

### Deuren

| Variant | Naam | Prijs |
|---|---|---|
| `standard` | Standaard kleurdeur (groot) | **€135** |
| `small` | Kleine deur (opzetkast) | **€75** |
| `veneer` | Fineerdeur | **€200** |

De variant wordt bepaald door het buitenkantmateriaal van die module: fineer → `veneer`, kleur → `standard`. Opzetkastdeuren zijn altijd `small`.

### Accessoires

| ID | Naam (NL) | Prijs | Categorie | Per stuk | Lage sectie |
|---|---|---|---|---|---|
| `extra-shelf` | Plank Extra | €45 | interior | ja | ja |
| `extra-rod` | Roede Extra | €35 | interior | ja | — |
| `drawer` | Lade | €185 | interior | ja | — |
| `jewelry-drawer` | Sieraden Lade | €245 | interior | ja | — |
| `pull-out-rod` | Uitrek Roede | €105 | interior | ja | — |
| `pull-out-desk` | Uitrek Bureau | €450 | interior | ja | — |
| `power-outlet` | **Prado 2.0** (stekkerdoos) | €145 | electrical | ja | ja |
| `handle` | Greep | €35 | mechanism | ja | — |
| `push-to-open` | Push to Open | €7,50 | mechanism | ja | — |
| `side-panels-36mm` | Zijpanelen 36 mm (upgrade) | €175 | upgrade | nee (per kast) | — |
| `veneer-interior` | Corpus in Fineer (meerprijs) | €425 | upgrade | nee (per kast) | — |

### Montage-staffels (op basis van subtotaal)

| Naam | Subtotaal | Prijs | Dagen | Monteurs |
|---|---|---|---|---|
| Small Project | €2.000 – €6.000 | **€720** | 1 | 2 |
| Medium Project | €6.000 – €12.000 | **€1.440** | 2 | 2 |
| Large Project | €12.000 – €18.000 | **€2.160** | 3 | 2 |

Onder €2.000 of boven €18.000 valt er geen staffel → montagekosten €0.

### Berekening (kledingkast)

```
moduleCost      = Σ modulelayoutprijs (enkel/dubbel per span)
doorCost        = Σ deurprijs per module met deur (span 2 = 2 deuren)
                  + opzetkastdeuren (aantal modules × small)
mechanismCost   = totaal aantal deuren × greepprijs (of push-to-open)
ledCost         = LED aan ? 180 + 65 × moduleCount : 0
powerHoleCost   = aantal stekkerdozen × 145
sidePanelCost   = 36 mm gekozen ? 175 : 0
surcharges      = schuine achterwand (1100) + schuine zijwanden (1100 per zijde)
deliveryCost    = 95

subtotal        = moduleCost + doorCost + mechanismCost + ledCost
                  + powerHoleCost + sidePanelCost + surcharges + deliveryCost
installation    = staffel(subtotal)
grandTotal      = subtotal + installation
```

Bij actieve **gratis montage** (`freeMontage: true`) wordt `installation` op €0 gezet, `freeMontageDiscount` gelijk aan de staffelprijs, en toont de UI de doorgestreepte oorspronkelijke prijs.

### Berekening (wasmachinekast) — afwijkingen

- Modules van **beide secties** worden opgeteld
- Lage-kastmodules hebben **fronten in plaats van deuren**: geen deurkosten, wel een eigen greepprijs per ladefront
- `mechanismCost = gewone deuren × deurgreep + (push-to-open-deuren + opzetkastdeuren) × push-to-open + ladefronten × ladefrontgreep`
- **Geen schuinte-toeslagen**

### Winkelwagen-totalen (`lib/cart/totals.ts`)

- Bezorgkosten worden **gededupliceerd**: `max(deliveryCost)` over alle regels — één zending
- Montage telt alleen bij kastregels
- `grandTotal = lineSubtotal + delivery + install`

### Kortingscodes

Sanity-document `coupon`: code, `percent` of `fixed`, waarde, vervaldatum, max. gebruik, huidig gebruik. Validatie in `lib/actions/coupon.ts` (fouten: `not_found`, `expired`, `limit_reached`). Teller wordt **na** succesvolle betaling opgehoogd via de Stripe-webhook. Korting is een **order-level** concept (`order.couponCode` / `order.discountAmount`).

### Levertijd

`getDeliveryWindow()` — venster van **56 tot 84 dagen** na besteldatum, geformatteerd in NL (`12. sep – 10. okt`).

---

## 10. Webshop-producten (PAX & stalen)

Twee actieve producten in Sanity:

### IKEA PAX deur (`/producten/ikea-pax-deur`) — bezorgkosten €35

Configurator met:

| Optie | Waarden |
|---|---|
| **Type** | Deuren · Hoekdeuren · Zijpaneel (afwerkpaneel) |
| **Breedte** | Uit prijsmatrix (numeriek) of label (hoekdeuren, bv. "27cm & 50cm") |
| **Hoogte** | Uit prijsmatrix, of *verlengd* (custom hoogte, default 200–300 cm) |
| **Scharnierzijde** | Linkerdeur · Rechterdeur · **Set van 2** (telt dubbel in de prijs) |
| **Diepte** | Alleen bij zijpaneel, default 20–120 cm (productiedetail, geen prijsinvloed) |
| **Materiaal** | Beperkt tot `allowedMaterialIds`; per materiaal een `materialSurcharge` |

Prijsopbouw: `unitPrice × panelen + toeslag × panelen`. Verlengde deuren hebben een aparte prijs per breedte; verlengde hoekdeuren één vaste prijs.

### Gratis materiaalstalen (`/producten/materiaalstalen`) — bezorgkosten €0

Anoniem formulier (geen login): kies **1 t/m `maxSelections` (default 3)** materialen, vul naam/e-mail/adres (NL) in, optionele telefoon en marketing-opt-in. Opgeslagen in `sample_request`; bevestigingsmail naar klant + notificatie naar `info@kasten-fabriek.nl`.

---

## 11. Winkelwagen, wishlist, checkout & bestellingen

### Winkelwagen

- **Uitgelogd**: localStorage (`kf-cart`, `CART_VERSION = 2`)
- **Ingelogd**: PostgreSQL-tabel `cart_item`; bij inloggen wordt de lokale cart samengevoegd (`lib/cart/merge.ts`)
- Twee regeltypes: `closet` (configurator) en `product` (PAX/stalen)
- Elke regel bewaart een **volledige configuratie-snapshot**, een **prijssnapshot** en twee **3D-screenshots** (deuren dicht/open)
- Bewerken: `?edit=<id>` op de configuratorroute laadt de configuratie terug in de store

### Wishlist

Spiegelt de winkelwagen (`wishlist_item`), zodat regels zonder conversie naar de cart kunnen. Bereikbaar via `/wishlist` en `/account/wishlist`.

### Checkout

1. Login vereist (anders redirect naar `/login?callbackUrl=/checkout`)
2. Verzendadres kiezen uit het adresboek
3. Optioneel kortingscode invoeren
4. `createCheckoutSession()` maakt een order met status `pending`, ordernummer `ORD-YYYYMMDD-XXXX`, en een Stripe Checkout Session
5. Adressen worden als snapshot op de order gezet (blijft bewaard als de klant het adres verwijdert)

### Stripe-webhook (`/api/webhooks/stripe`)

Op `checkout.session.completed`:
1. Order atomisch naar `paid` (`WHERE status != 'paid'` — idempotent bij retries)
2. Winkelwagen van de gebruiker leegmaken
3. Kortingscode-teller ophogen
4. Bevestigings- en admin-mail versturen met PDF-bijlage

### Orderstatussen

`pending` → `paid` → `processing` → `shipped` → `delivered` (of `cancelled`).
NL-labels: In behandeling · Betaald · In productie · Verzonden · Geleverd · Geannuleerd.

---

## 12. E-mails & order-documenten

Verzending via **Resend** vanaf het geverifieerde domein `kasten-fabriek.nl`.

| Mail | Van | Naar | Onderwerp |
|---|---|---|---|
| Orderbevestiging | `bestellingen@kasten-fabriek.nl` | klant | `Bevestiging bestelling <nr> — Kastenfabriek` |
| Ordernotificatie | `bestellingen@kasten-fabriek.nl` | `info@kasten-fabriek.nl` | `Nieuwe bestelling <nr> — <naam>` |
| Stalenbevestiging | `info@kasten-fabriek.nl` | klant | `Je gratis materiaalstalen zijn onderweg — Kastenfabriek` |
| Stalennotificatie | `info@kasten-fabriek.nl` | admin | `Nieuwe stalenaanvraag — <naam>` |

Reply-to van ordermail gaat naar `info@kasten-fabriek.nl` (instelbaar via `RESEND_ORDER_REPLY_TO`). Beide ordermails worden parallel verstuurd (`Promise.allSettled`) zodat één fout de andere niet blokkeert.

### Specificatie-PDF (`Specificaties-<ordernummer>.pdf`)

Per kastregel:
- Titel + samenvatting (`summarizeCloset`)
- **Vooraanzicht zonder deuren** — vector-wireframe getekend uit de configuratie (`lib/order/wireframe.ts` + `wireframe-svg.ts`), inclusief maatvoering, schuintes, roedes en slotbreedtes
- **Specificaties** — afmetingen, materialen, greep, schuintes, opzetkast, extra's
- **Moduletabel** — Plaats · Layout · Module · Omschrijving · Uitvoering · Accessoires (per sectie bij een wasmachinekast)
- **3D-weergave** — de twee canvas-captures met bijschrift
- **Prijsopbouw** — regel voor regel

De captures worden in de HTML-mail als inline attachments meegestuurd (`lib/email/inline-images.ts`).

Lokale preview: `npm run preview:order-docs` → schrijft naar `tmp/order-docs/`.

---

## 13. Account & authenticatie

**Better Auth** met Drizzle-adapter op PostgreSQL.

- E-mail + wachtwoord (`requireEmailVerification: false` — **aanzetten in productie zodra een mailprovider gekoppeld is**)
- Google OAuth
- Sessieduur **7 dagen**, ververst elke 24 uur
- `trustedOrigins` uit `BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`, Vercel-URLs en `localhost:3000`
- Sessiecookie wordt via `getSessionCookie()` gelezen (over HTTPS heet die `__Secure-…`)

**Accountpagina's:** dashboard (`/account`), bestellingen, wishlist, adresboek (verzend-/factuuradres, standaardadres, NL-velden incl. huisnummer + toevoeging).

---

## 14. Kennisbank

`/kennisbank` — grid met **7 items** in **5 categorieën**: Inmeten · Inspiratie · Materialen · Montage · Onderhoud.

- Mediatypes: **Artikel**, **Video** (Mux-player), **PDF / handleiding** (PDF-paneel)
- Filters op type, categorie en zoekterm; deeplinks (`?type=video&categorie=montage&q=…`) renderen server-side met het filter al toegepast
- `revalidate: 60` — nieuwe items verschijnen zonder deploy
- Detailpagina: `/kennisbank/[slug]`

---

## 15. Sanity CMS — alle documenttypes

Studio op `/studio`, Nederlandse locale, Vision-plugin actief.

### Studio-structuur

```
Inhoud
├── Website
│   ├── Instellingen (singleton)
│   ├── Kastdetails (homepage) (singleton)
│   ├── Pagina's
│   └── Klantbeoordelingen
├── Kennisbank
│   ├── Items
│   └── Categorieën
├── Commerce
│   ├── Producten
│   └── Kortingscodes
└── Configurator
    ├── Prijsconfiguratie (singleton)
    ├── Onderdelen
    │   ├── Modules
    │   ├── Deuren
    │   ├── Grepen
    │   └── Accessoires
    └── Montage
```

### Documenttypes

| Type | Titel | Belangrijkste velden |
|---|---|---|
| `siteSettings` | Site Instellingen | siteName, logo, tagline, contact, adres, socials, verzendinfo, btw 21%, KvK, **mainsElectricityNotice** |
| `page` | Pagina | title, slug, metaDescription, heroImage, Portable Text, isPublished |
| `testimonial` | Testimonial | quote, name, company, image, order |
| `hotspotSection` | Kastdetails (hotspots) | eyebrow, heading, cursief accent, intro, hoofdfoto, punten (titel, tekst, detailfoto, x//y %, label, link) |
| `kennisbankCategory` | Kennisbank categorie | title, slug, order |
| `kennisbankItem` | Kennisbank item | mediaType (artikel/video/pdf), tabs Inhoud/Media/SEO |
| `moduleLayout` | Module Layout (Indeling) | layoutId, name, description, contents (planken/roedes/lades/wasmachineplank/bureau), priceSingle, priceDouble, availableForTopCabinet, sectionType |
| `doorType` | Door Type | doorId, name, price, variant (standard/small/veneer) |
| `handle` | Handle | handleId, name, nameNl, productCode, image, price, heightCm, allowedMaterials, fitsLowModule, noRotationOnDrawer, meshId, bodyColor |
| `accessory` | Accessory | accessoryId, name, nameNl, price, category, perUnit, maxPerCorpus, availableForLowSection |
| `installationTier` | Installation Tier | name, minTotal, maxTotal, price, days, people |
| `pricingConfig` | Pricing Configuration | freeMontage, currency, led, deliveryPrice, schuinte-toeslagen, constraints |
| `coupon` | Coupon | code, discountType, discountValue, expiresAt, maxUses, currentUses |
| `product` | Product | title, slug, productType (pax-doors/samples), isActive, omschrijvingen, hero + galerij, productInfo, deliveryFee, paxConfig, sampleConfig |

**Huidige inhoud:** 15 moduleLayouts · 37 handles · 11 accessoires · 3 doorTypes · 3 installationTiers · 1 coupon · 2 producten · 7 kennisbankitems · 5 categorieën · 5 testimonials · 0 pagina's.

---

## 16. Database (PostgreSQL / Drizzle)

| Tabel | Doel |
|---|---|
| `user`, `session`, `account`, `verification` | Better Auth |
| `address` | Adresboek (shipping/billing, isDefault, NL-velden) |
| `cart_item` | Winkelwagen — kind, configuration (jsonb), price_snapshot (jsonb), quantity, 2× screenshot-URL |
| `wishlist_item` | Spiegelt `cart_item` zonder quantity |
| `order` | orderNumber (uniek), status, totalAmount (**centen**), currency, adres-refs + snapshots, notes, Stripe-ids, couponCode, discountAmount, tijdstempels (paid/shipped/delivered) |
| `order_item` | Per regel: kind, sanityProductId, productName, configurationSnapshot (jsonb), quantity, unitPrice, totalPrice (centen) |
| `invoice` | invoiceNumber (uniek), status, subtotal/vatAmount/vatRate (21)/totalAmount in centen, UBL-data (jsonb), pdfPath, issued/due/paid |
| `review` | rating 1–5, title, content, isVerifiedPurchase, isApproved (moderatie) |
| `sample_request` | Anonieme stalenaanvraag: materialIds (jsonb), NAW, marketingOptIn, status |

Migraties in `db/migrations/`. Commando's: `db:generate`, `db:migrate`, `db:push`, `db:studio`.

> `invoice` en `review` zijn wél gemodelleerd maar worden in de UI nog niet gebruikt.

---

## 17. 3D-scene & assets

### Renderer

WebGPU-renderer met bewaking (`WebGPURenderGuard`, `CanvasFreezeGuard`) en `devicePower`-detectie voor kwaliteitsniveau. Postprocessing via `@react-three/postprocessing`. Omgeving: `SceneEnvironment` + `/public/hdr.hdr` en een cubemap voor module-highlights.

### 3D-modellen (`/public/objects`)

| Bestand | Gebruik |
|---|---|
| `Handles.glb` / `Handles-transformed.glb` | Alle greepmeshes (per `meshId`) |
| `HingeNewt.glb` | Scharnieren |
| `onderstel.glb` | Plint/onderstel |
| `mainmodules/DrawerModule.glb` | Ladeblok |
| `mainmodules/RodModule.glb` | Roede |
| `mainmodules/SplitModule.glb` | Split-vak |
| `mainmodules/DeskModule.glb` | Bureau |
| `washermodules/ModuleWasherSingle.glb` | Wasmachine enkel (layout 11) |
| `washermodules/ModuleWasherDouble.glb` | Wasmachine dubbel (layout 13) |
| `washermodules/ModuleWasherPlank.glb` | Wasmachine + plank (layout 14) |
| `washermodules/12_WMPlankLow.glb` | Lage kast plank (20) |
| `washermodules/13_WMSingleLow.glb` | Lage kast enkel (21) |
| `washermodules/14_WMDoubleLow.glb` | Lage kast dubbel (22) |
| `washermodules/WMWasherOnlyLow.glb` | Wasmachinenis lage kast (23) |
| `washermodules/15_WMOpen.glb` | Open variant |

Meshes met suffix `_ws` schalen mee met de slotbreedte; `widthScaleMeshes` + `nativeSlotWidth` regelen fronten die exact met de slotgroei meeschalen. Bounding boxes vooraf gegenereerd via `npm run generate:glb-bboxes`.

### Overige assets

- `/public/materials/` — 5 fineertexturen (jpg voor 3D, webp voor UI)
- `/public/colorways/` — 38 sfeerfoto's
- `/public/images/details/` — 7 detailfoto's (hotspots)
- `/public/stickfigures/` — 5 illustraties (werkwijze)
- `/public/svg/` — technische tekeningen (vooraanzichten, vouwpaneel)
- `/public/og/` — share-afbeeldingen
- `/public/logo.svg`, `/public/hdr.hdr`, `/public/silhouette.png`

---

## 18. Environment variables

| Variabele | Doel |
|---|---|
| `DATABASE_URL` | PostgreSQL-connectiestring |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project (`ai3vrh8e`) |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset (`production`) |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Default `2026-01-09` |
| `SANITY_API_TOKEN` | Schrijftoken (coupon-teller) |
| `BETTER_AUTH_URL` | Basis-URL auth |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Client-side auth-URL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `STRIPE_SECRET_KEY` | Stripe API (versie `2026-02-25.clover`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook-verificatie |
| `RESEND_API_KEY` | E-mailverzending |
| `RESEND_FROM` | Afzender algemeen (default `info@kasten-fabriek.nl`) |
| `RESEND_ORDER_FROM` | Afzender orders (default `bestellingen@kasten-fabriek.nl`) |
| `RESEND_ORDER_REPLY_TO` | Reply-to orders |
| `ADMIN_EMAIL` | Ontvanger notificaties |
| `NEXT_PUBLIC_SITE_URL` | Canonical/OG-basis |
| `NEXT_PUBLIC_MUX_HERO_PLAYBACK_ID` | Hero-video |
| `VERCEL_URL` / `VERCEL_PROJECT_PRODUCTION_URL` | Auto-trusted origins |

---

## 19. Scripts & commando's

```bash
npm run dev                  # dev-server
npm run build                # productiebuild
npm run start                # productieserver
npm run lint                 # ESLint

npm run test                 # Vitest (eenmalig)
npm run test:watch           # Vitest watch

npm run db:generate          # Drizzle-migratie genereren
npm run db:migrate           # Migraties draaien
npm run db:push              # Schema direct pushen
npm run db:studio            # Drizzle Studio

npm run sanity:seed          # Prijsdata seeden
npm run sanity:seed-hotspots # Hotspot-sectie seeden
npm run preview:order-docs   # Order-PDF/mail lokaal renderen
npm run generate:glb-bboxes  # Bounding boxes uit GLB's
```

---

## 20. Teststatus & openstaande punten

### Tests

**652 van 656 tests slagen** (53 van 54 bestanden). Dekking o.a.: prijsengine, toeslagen, gratis montage, cart-totalen/merge/discount, order-spec, wireframe, e-mails, wasmachinekast-secties (defaults, pricing, layout-transities, snapshotmigratie), module-layouts, schuinte-berekeningen, handgreep-fit, tour-storage.

**4 falende tests — allemaal in `app/(configurator)/kledingkast/__tests__/resolveElementPositions.test.ts`:** de test verwacht nog de oude constanten. De code gebruikt `SHELF_SPACING = 0.368` en `startY 1.84`, de test asserteert `0.35` en `1.75`. Dit is een **verouderde test, geen bug in de app** — de verwachtingen moeten worden bijgewerkt.

```bash
npx vitest run "app/(configurator)/kledingkast/__tests__/resolveElementPositions.test.ts"
```

### Aandachtspunten voor oplevering

1. **Dode footerlinks** — `/about`, `/projects` en `/ikea-pax` bestaan niet. `/ikea-pax` moet waarschijnlijk `/producten/ikea-pax-deur` zijn; de andere twee wijzen naar "Onze kasten" en "Materialen" die geen pagina hebben.
2. **Contactgegevens zijn placeholders** — telefoonnummer `+31 6 1234 5678` in de footer; `siteSettings` in Sanity heeft `contactEmail`, `contactPhone`, `kvkNumber`, `vatNumber` en `shippingInfo` nog leeg.
3. **`requireEmailVerification: false`** in Better Auth — aanzetten zodra e-mailverificatie gewenst is.
4. **`freeMontage` staat op `false`** in Sanity, terwijl de navigatie- en homepage-promostrips *"gratis montage"* aankondigen. Zet de vlag aan (of pas de copy aan) vóór livegang.
5. **Services-balk** toont Inmeetservice/Montageservice tweemaal (duplicaat in `ConfiguratorServicesBar.tsx`).
6. **`invoice`- en `review`-tabellen** bestaan wel in de database maar hebben nog geen UI of flow.
7. **Openstaande werkkopie** — 10 gewijzigde bestanden nog niet gecommit (order-spec, order-documenten, wasmachinekast-moduleLayouts, cart-types).
8. **Schema-naamgeving** — `singleCorpus`/`doubleCorpus`/`maxPerCorpus` slaan feitelijk op een *module*. Bewust zo gelaten; hernoemen vereist een Sanity-migratie.
9. **Dark mode** is volledig gedefinieerd in CSS maar staat uit.

### Referentiedocumenten in de repo

- `CONTEXT.md` — canonieke terminologie (corpus, module, slot, schuinte, sectie, werkblad …)
- `docs/adr/0001-wasmachinekast-sections.md` — architectuurbesluit sectiemodel
- `docs/buiten-scope-analyse.md`
- `issues/` — PRD's en issues, incl. `client-brief.md`; afgeronde items in `issues/done/`
