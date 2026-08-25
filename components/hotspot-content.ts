import { CONFIGURATORS_HREF } from "@/lib/configurators";

export type HotspotPoint = {
  /** Stable key; also used as the DOM hook (data-hotspot-target). */
  name: string;
  /** Screenreader label: "Bekijk {label}". */
  label: string;
  /** Position on the base image, in % of its width/height. */
  x: number;
  y: number;
  image: string;
  title: string;
  body: string;
  href?: string;
  ctaLabel?: string;
};

export type HotspotContent = {
  eyebrow: string;
  heading: string;
  headingAccent?: string;
  intro?: string;
  baseImage: string;
  baseImageAlt: string;
  /** Width / height of the base image, so the hotspot box never crops it. */
  baseImageAspectRatio: number;
  points: HotspotPoint[];
};

/**
 * Used until the "Kastdetails" document is filled in Sanity. Base and detail
 * images are frames pulled from the hero video (Mux) at 3840px, so the section
 * matches the rest of the site's renders.
 */
export const DEFAULT_HOTSPOT_CONTENT: HotspotContent = {
  eyebrow: "Ontdek de kast",
  heading: "Elk detail is een keuze",
  headingAccent: "die jij maakt.",
  intro: "Tik op de punten in de kast en zie wat er achter elk onderdeel zit.",
  baseImage: "/images/details/wasruimte-hd.webp",
  baseImageAlt:
    "Wasmachinekast op maat met wasmachine, droger, lades en open vakken",
  baseImageAspectRatio: 16 / 9,
  points: [
    {
      name: "wasmachine",
      label: "de wasmachinemodule",
      x: 36,
      y: 49,
      image: "/images/details/wasmachine-detail.webp",
      title: "Wasmachine en droger strak ingebouwd",
      body: "De kast wordt opgebouwd rond de maten van jouw apparaten, zodat wasmachine en droger netjes in de kastwand opgaan in plaats van los in de ruimte te staan. Eromheen blijft alles even strak doorlopen: dezelfde kleur, dezelfde naden, dezelfde lijn.",
      href: "/wasmachinekast",
      ctaLabel: "Ontwerp je wasmachinekast",
    },
    {
      name: "lades",
      label: "de lades",
      x: 37,
      y: 68,
      image: "/images/details/frame-28.webp",
      title: "Lades die zacht sluiten",
      body: "Volledig uittrekbare geleiders, dus je komt ook achterin nog bij alles. De fronten krijgen dezelfde kleur of hetzelfde houtlook als de rest van de kast, zodat de kastwand één vlak blijft.",
    },
    {
      name: "indeling",
      label: "planken en vakken",
      x: 59,
      y: 43,
      image: "/images/details/frame-19.webp",
      title: "Planken en vakken die jij bepaalt",
      body: "Kies per module hoeveel legplanken je wilt en op welke hoogte ze komen. In de configurator schuif je vakken, roedes en lades net zolang tot de indeling klopt met wat je écht opbergt.",
      href: CONFIGURATORS_HREF,
      ctaLabel: "Stel je indeling samen",
    },
    {
      name: "maatwerk",
      label: "maatwerk tot aan het plafond",
      x: 48,
      y: 23,
      image: "/images/details/frame-30.webp",
      title: "Tot aan het plafond, ook schuin",
      body: "Elke kast maken we op de millimeter voor jouw ruimte — tot aan het plafond, langs een schuine wand of om een dakkapel heen. Geen stofrand bovenop en geen verloren centimeters ernaast.",
    },
    {
      name: "afwerking",
      label: "kleur en houtlook",
      x: 66,
      y: 31,
      image: "/images/details/frame-33.webp",
      title: "Kleur en houtlook tot in de rand",
      body: "Ook de bovenkant, de zijkanten en de randen die je zelden ziet werken we af in dezelfde kleur of hetzelfde houtlook. Alle kleuren en houtlooks liggen op voorraad — bestel gerust eerst een staal.",
      href: "/producten/materiaalstalen",
      ctaLabel: "Bestel gratis stalen",
    },
    {
      name: "deuren",
      label: "deuren en grepen",
      x: 47.5,
      y: 57,
      image: "/images/details/frame-37.webp",
      title: "Greeploos of juist met greep",
      body: "Kies strakke greeploze deuren met push-to-open, of een greep in zwart, rvs of hout. De scharnieren zijn zachtsluitend en in drie richtingen verstelbaar, zodat elke naad overal even strak blijft.",
    },
  ],
};
