import HotspotShowcase from "./HotspotShowcase";
import { DEFAULT_HOTSPOT_CONTENT } from "./hotspot-content";
import { getHotspotSection } from "@/sanity/lib/hotspotSection";

export default async function HotspotSection() {
  // Falls back to the built-in copy until "Kastdetails" is filled in Sanity.
  const content = (await getHotspotSection()) ?? DEFAULT_HOTSPOT_CONTENT;

  return <HotspotShowcase content={content} />;
}
