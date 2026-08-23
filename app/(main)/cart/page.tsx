import { getServerSession } from "@/lib/actions/auth";
import { getDbCartItems } from "@/lib/actions/cart";
import { getSiteSettings } from "@/sanity/lib/siteSettings";
import { CONTACT_EMAIL } from "@/lib/configurators";
import { formatShowroomAddress } from "@/components/ShowroomCta";
import CartView from "./CartView";

export const metadata = {
  title: "Winkelwagen",
};

export default async function CartPage() {
  const session = await getServerSession();
  const isAuthenticated = !!session?.user;

  const dbItems = isAuthenticated ? await getDbCartItems() : [];
  const settings = await getSiteSettings();

  return (
    <CartView
      isAuthenticated={isAuthenticated}
      initialDbItems={dbItems}
      showroom={{
        email: settings.contactEmail?.trim() || CONTACT_EMAIL,
        addressLine: formatShowroomAddress(settings.address),
      }}
    />
  );
}
