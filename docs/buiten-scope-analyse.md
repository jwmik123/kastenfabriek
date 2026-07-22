# Buiten-scope analyse — kasten-fabriek.nl

Vergelijking van de gebouwde codebase met de offerte (`offerte-kasten-fabriek-v3.pdf`, 24 nov 2025).
Hieronder de zaken die **buiten de oorspronkelijke offerte-scope** zijn gebouwd.

---

## Scope volgens offerte (ter referentie)

**Website:** moderne responsive site, 6 hoofdpagina's (Home, Kasten configureren, Over ons, Werkwijze, Blogs/inspiratie, Contact), Sanity CMS, webshop-functionaliteit, Google Analytics.

**3D Configurator:** type kast (incl. schuine wanden), afmetingen, segmenten, modules (ladeblokken/planken/kledingrekken), kleur + materiaal per module, handgrepen, optie alleen deuren, real-time prijs + 3D-preview. Extra: opslaan/delen via link, PDF-export, e-mail van configuratie, directe bestelling/offerteaanvraag.

**Modules in offerte:** kledingkast, wasmachinekast, deur.

**Techniek:** Next.js, Three.js, Sanity, API + Webshop, Vercel, Google Analytics, Resend.

**Toekomstige modules (NIET in deze offerte):** TV-meubel, badkamermeubels — €2250 ex. BTW per module.

---

## Extra functies & modules (buiten offerte-scope)

### 1. Wasmachinekast — lage kast / werkblad-systeem (grote uitbreiding)
De offerte beschrijft één wasmachinekast-module. Gebouwd is een volledig **secties-systeem** waarmee de kast uit twee fysiek losse corpussen kan bestaan: een hoge kast én een lage kast met werkblad. Dit is een aparte PRD + architectuurbeslissing (ADR) met eigen domeinmodel, tests en migratie.

- **4 layouts** kiesbaar in stap 1: `hoge kast`, `lage kast`, `lage links`, `lage rechts` — met visuele previews.
- **Lage kast** (vast 90 cm) met een **werkblad** als dak: kiesbaar in 18 mm of 36 mm, apart te kleuren.
- Per sectie eigen breedte, modules en indeling; diepte/handgreep/accessoires/materiaal gedeeld.
- Wasmachine plaatsbaar in hoge óf lage kast (incl. onder-werkblad opstelling).
- Wizard groeide van **6 naar 7 stappen** (nieuwe Layout-stap + handgrepen als losse stap).
- Eigen prijsberekening per sectie + werkblad, layout-overgangen (spiegelen/aanmaken/verwijderen met bevestiging), snapshot-migratie van oude configuraties.
- 5 nieuwe testbare modules: layout-transitions, sectie-defaults, sectie-pricing, snapshot-migratie, module-layout-filter.
- Nieuwe Sanity-velden: `moduleLayout.sectionType` (hoog/laag/beide) en `accessory.availableForLowSection`.

  `app/(configurator)/wasmachinekast/sections/*`, `steps/LayoutStep.tsx`, `docs/adr/0001-wasmachinekast-sections.md`, `issues/prd-wasmachinekast-low-section.md`

### 2. LED-verlichting configuratiestap
Lichtstrips in de kast met instelbare warmte (eigen shader). Geen offertemodule.
`kledingkast/steps/LightingStep.tsx`, `scene/InstancedLightStrips.tsx`, `materials/StripWarmthContext.tsx`, `shaders/stripWarmth.ts`

### 3. Accessoires-systeem + configuratiestap
Stopcontactgaten, extra planken, zijpanelen, netstroom-melding — als losse stap met eigen Sanity-beheer.
`*/steps/AccessoiresStep.tsx`, `sanity/schemaTypes/accessory.ts`

### 4. Opzetkast (top cabinet)
Extra module bovenop de kast.
`kledingkast/scene/TopCabinet.tsx`

### 5. "Gratis montage" / installatie-prijssysteem
Installatietiers met korting, doorgevoerd in configurator → checkout → e-mail.
`sanity/schemaTypes/installationTier.ts`, `lib/configurator/free-montage.ts`

### 6. Levertijd-/leverdatum-indicatie
Berekende levertijd, getoond in winkelwagen, checkout en e-mail.
`lib/delivery-window.ts`

### 7. Begeleide rondleiding / onboarding-tour
Interactieve uitleg-tour door de configurator.
`app/(configurator)/_shared/tour/*`

### 8. Materiaalstalen / kleurstalen bestellen
Eigen besteltraject met bevestigings- en admin-e-mails.
`producten/materiaalstalen`, `components/products/SampleConfigurator.tsx`, `db/schema/sampleRequests.ts`, `lib/actions/sample-request.ts`, `emails/SampleRequest*`

---

## Extra 3D-renders (buiten offerte-scope)

### 9. Render per kast-materiaal
Voor elk beschikbaar materiaal/kleurway zijn aparte 3D-renders gemaakt (≈2 renders per materiaal, ~19 materialen) voor de materiaalkeuze-preview.
`public/colorways/*.webp`, `components/products/ColorwayPreview.tsx`

### 10. Render van alle modules op een rij
Aparte render waarin alle modules naast elkaar getoond worden (gebruikt in de homepage scroll-sectie).
`public/images/Modules_High4.webp`, `ModulesH.webp`, `components/ModulesScrollSection.tsx`

---

> Opmerking: de offerte stelt dat "extra aanpassingen buiten scope apart gefactureerd worden". Bovenstaande lijst is de basis voor die nacalculatie.
