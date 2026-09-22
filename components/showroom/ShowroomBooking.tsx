import { getShowroomSettings } from "@/sanity/lib/showroom";
import { getSiteSettings } from "@/sanity/lib/siteSettings";
import { formatShowroomAddress } from "@/components/ShowroomCta";
import { addDays, DEFAULTS, localNow } from "@/lib/showroom/availability";
import { getAvailability } from "@/lib/showroom/query";
import ShowroomBookingSection from "./ShowroomBookingSection";

/**
 * Server half of the homepage booking section: reads the schedule from Sanity,
 * computes the first weeks of availability, and renders nothing at all while
 * the owner has booking switched off.
 */
export default async function ShowroomBooking() {
  const [settings, site] = await Promise.all([getShowroomSettings(), getSiteSettings()]);
  if (!settings || settings.enabled !== true) return null;

  const now = new Date();
  const today = localNow(now).date;
  const horizon = addDays(today, 7 * (settings.maxWeeksAhead ?? DEFAULTS.maxWeeksAhead));
  const days = settings.bookableFrom && settings.bookableFrom > today ? [] : await getAvailability(today, horizon, now);

  return (
    <ShowroomBookingSection
      today={today}
      horizon={horizon}
      initialDays={days}
      introText={settings.introText}
      addressLine={formatShowroomAddress(site.address)}
      bookableFrom={settings.bookableFrom ?? null}
    />
  );
}
