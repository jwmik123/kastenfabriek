import { getServerSession } from "@/lib/actions/auth";
import { getDbWishlistItems } from "@/lib/actions/wishlist";
import WishlistView from "./WishlistView";

export const metadata = {
  title: "Verlanglijst | Kastenfabriek",
  description: "Bekijk je opgeslagen ontwerpen",
};

export default async function WishlistPage() {
  const session = await getServerSession();
  const isAuthenticated = !!session?.user;

  const dbItems = isAuthenticated ? await getDbWishlistItems() : [];

  return <WishlistView isAuthenticated={isAuthenticated} initialDbItems={dbItems} />;
}
