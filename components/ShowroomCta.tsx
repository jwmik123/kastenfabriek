import { ArrowRight, MapPin } from "lucide-react";

/** Structural mirror of `SiteAddress` — that type lives in a server-only module. */
export interface ShowroomAddress {
  street?: string;
  postalCode?: string;
  city?: string;
}

export interface ShowroomCtaProps {
  email: string;
  addressLine?: string;
}

/** "Jelle Zijlstraweg 60C, 1689ZX Zwaag" — or undefined when Sanity has no address yet. */
export function formatShowroomAddress(
  address?: ShowroomAddress,
): string | undefined {
  const street = address?.street?.trim();
  if (!street) return undefined;
  const place = [address?.postalCode?.trim(), address?.city?.trim()]
    .filter(Boolean)
    .join(" ");
  return [street, place].filter(Boolean).join(", ");
}

/** Where the homepage calendar lives; the CTA sends the customer there. */
export const SHOWROOM_BOOKING_HREF = "/#showroom";

/**
 * Invitation to see materials and modules in the showroom before ordering —
 * shown under the items in the cart and wishlist.
 */
export default function ShowroomCta({ email, addressLine }: ShowroomCtaProps) {
  const mapsHref = addressLine
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        addressLine,
      )}`
    : undefined;

  return (
    <div className="bg-primary rounded-2xl shadow-sm mt-8 font-poppins p-8 md:p-10">
      <p className="text-amber-400 text-xs uppercase tracking-widest font-semibold mb-3">
        Showroom · op zaterdag geopend
      </p>
      <h2 className="text-2xl md:text-3xl font-bold text-white">
        Liever eerst zien en{" "}
        <span className="italic text-primary-300">voelen?</span>
      </h2>
      <p className="text-white/70 mt-3 max-w-xl">
        Nog niet klaar om te bestellen? Kom langs in onze showroom en bekijk de
        materialen en modules in het echt. Kies online een dag en tijdslot; heb
        je vragen, mail dan naar{" "}
        <a href={`mailto:${email}`} className="underline underline-offset-4 decoration-white/30 hover:text-white">
          {email}
        </a>
        .
      </p>
      {addressLine && (
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-white/60 text-sm mt-3 underline underline-offset-4 decoration-white/30 hover:text-white hover:decoration-white transition-colors"
        >
          <MapPin className="w-4 h-4 shrink-0" />
          {addressLine}
        </a>
      )}
      <div>
        <a
          href={SHOWROOM_BOOKING_HREF}
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 text-sm font-semibold text-white bg-amber-500 rounded-md hover:opacity-80 transition-opacity duration-150 shadow-sm"
        >
          Plan een showroombezoek
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
