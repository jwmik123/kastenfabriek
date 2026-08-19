import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/actions/auth";
import { getDbCartItems } from "@/lib/actions/cart";
import { getAddresses } from "@/lib/actions/address";
import CheckoutForm from "./CheckoutForm";

export const metadata = {
  title: "Afrekenen",
};

export default async function CheckoutPage() {
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/login?callbackUrl=/checkout");
  }

  const [cartItems, addresses] = await Promise.all([
    getDbCartItems(),
    getAddresses(),
  ]);

  if (cartItems.length === 0) {
    redirect("/cart");
  }

  return (
    <CheckoutForm
      addresses={addresses}
      cartItems={cartItems}
    />
  );
}
