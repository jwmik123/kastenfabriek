import { getServerSession } from "@/lib/actions/auth";
import { getDbWishlistItems } from "@/lib/actions/wishlist";
import { getSiteSettings } from "@/sanity/lib/siteSettings";
import { CONTACT_EMAIL } from "@/lib/configurators";
import { formatShowroomAddress } from "@/components/ShowroomCta";
import WishlistView from "./WishlistView";

export const metadata = {
  title: "Verlanglijst",
  description: "Bekijk je opgeslagen ontwerpen",
};

export default async function WishlistPage() {
  const session = await getServerSession();
  const isAuthenticated = !!session?.user;

  const dbItems = isAuthenticated ? await getDbWishlistItems() : [];
  const settings = await getSiteSettings();

  return (
    <WishlistView
      isAuthenticated={isAuthenticated}
      initialDbItems={dbItems}
      showroom={{
        email: settings.contactEmail?.trim() || CONTACT_EMAIL,
        addressLine: formatShowroomAddress(settings.address),
      }}
    />
  );
}
