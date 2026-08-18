import OrderDocumentBody from "./OrderDocumentBody";
import type { OrderDocumentProps } from "@/lib/order/types";

/** The order confirmation the customer receives, with the spec PDF attached. */
export default function OrderConfirmation(props: OrderDocumentProps) {
  return <OrderDocumentBody variant="customer" {...props} />;
}

export type { OrderDocumentProps as OrderConfirmationProps };
export type {
  OrderLine as EmailOrderItem,
  ClosetOrderLine as ClosetEmailItem,
  ProductOrderLine as ProductEmailItem,
} from "@/lib/order/types";
