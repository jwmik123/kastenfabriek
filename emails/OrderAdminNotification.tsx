import OrderDocumentBody from "./OrderDocumentBody";
import type { OrderDocumentProps } from "@/lib/order/types";

/**
 * What we get ourselves when an order is paid — the same specification as the
 * customer's mail, plus their contact details, under a "Nieuwe bestelling"
 * subject so it is easy to filter.
 */
export default function OrderAdminNotification(props: OrderDocumentProps) {
  return <OrderDocumentBody variant="admin" {...props} />;
}

export type { OrderDocumentProps as OrderAdminNotificationProps };
