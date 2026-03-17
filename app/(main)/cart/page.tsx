import { getServerSession } from "@/lib/actions/auth";
import { getDbCartItems } from "@/lib/actions/cart";
import CartView from "./CartView";

export const metadata = {
  title: "Winkelwagen | Kastenfabriek",
};

export default async function CartPage() {
  const session = await getServerSession();
  const isAuthenticated = !!session?.user;

  const dbItems = isAuthenticated ? await getDbCartItems() : [];

  return <CartView isAuthenticated={isAuthenticated} initialDbItems={dbItems} />;
}
