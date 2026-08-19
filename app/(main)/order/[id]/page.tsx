import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package } from "lucide-react";
import { getServerSession } from "@/lib/actions/auth";
import { getOrderById, getOrderItems } from "@/lib/actions/order";
import OrderLineItem, {
  type OrderLineSnapshot,
} from "@/components/order/OrderLineItem";
import { buildOrderSummary } from "@/lib/order/order-summary";
import type {
  ClosetConfigSnapshot,
  PriceSnapshot,
  ProductConfigSnapshot,
  ProductPriceSnapshot,
} from "@/lib/cart/types";

export const metadata = {
  title: "Bestelling bevestigd",
};

const fmt = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const STATUS_LABELS: Record<string, string> = {
  pending: "In behandeling",
  paid: "Betaald",
  processing: "In productie",
  shipped: "Verzonden",
  delivered: "Geleverd",
  cancelled: "Geannuleerd",
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getServerSession();
  if (!session?.user) {
    redirect("/login");
  }

  const orderRecord = await getOrderById(id);
  if (!orderRecord) {
    redirect("/account/orders");
  }

  const rows = await getOrderItems(id);
  const lines: OrderLineSnapshot[] = rows.map((row) => {
    if (row.kind === "product") {
      const snap = row.configurationSnapshot as {
        configuration: ProductConfigSnapshot;
        priceSnapshot: ProductPriceSnapshot;
      };
      return {
        kind: "product",
        configuration: snap.configuration,
        priceSnapshot: snap.priceSnapshot,
        quantity: row.quantity,
      };
    }
    const snap = row.configurationSnapshot as {
      configuration: ClosetConfigSnapshot;
      priceSnapshot: PriceSnapshot;
    };
    return {
      kind: "closet",
      configuration: snap.configuration,
      priceSnapshot: snap.priceSnapshot,
      quantity: row.quantity,
    };
  });

  const summary = buildOrderSummary(lines, {
    code: orderRecord.couponCode,
    amountCents: orderRecord.discountAmount,
  });

  const shippingAddress = orderRecord.shippingAddressSnapshot as {
    firstName?: string;
    lastName?: string;
    street?: string;
    houseNumber?: string;
    houseNumberAddition?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  } | null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      {/* Success header */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bestelling geplaatst!</h1>
        <p className="text-gray-500">
          Bedankt voor je bestelling. We nemen zo snel mogelijk contact met je op.
        </p>
      </div>

      {/* Order details */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
        {/* Order number & status */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Bestelnummer</p>
            <p className="font-semibold text-gray-900 text-lg">{orderRecord.orderNumber}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            orderRecord.status === "paid" || orderRecord.status === "delivered"
              ? "bg-green-100 text-green-700"
              : orderRecord.status === "cancelled"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
          }`}>
            {STATUS_LABELS[orderRecord.status] ?? orderRecord.status}
          </span>
        </div>

        {/* Shipping address */}
        {shippingAddress && (
          <div>
            <h2 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              Bezorgadres
            </h2>
            <div className="text-sm text-gray-600">
              {shippingAddress.firstName && (
                <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
              )}
              {shippingAddress.street && (
                <p>{shippingAddress.street} {shippingAddress.houseNumber}{shippingAddress.houseNumberAddition}</p>
              )}
              {shippingAddress.postalCode && (
                <p>{shippingAddress.postalCode} {shippingAddress.city}</p>
              )}
              {shippingAddress.country && <p>{shippingAddress.country}</p>}
            </div>
          </div>
        )}

        {/* Line items */}
        {lines.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-medium text-gray-900">Bestelde items</h2>
            {lines.map((line, i) => (
              <OrderLineItem key={i} item={line} />
            ))}
          </div>
        )}

        {/* Order-level costs: one shipment, one montage, one coupon. */}
        <div className="pt-4 border-t border-gray-100 text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Producten</span>
            <span>{fmt.format(summary.lineSubtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Bezorging</span>
            <span>{fmt.format(summary.delivery)}</span>
          </div>
          {summary.installationGross > 0 && (
            <div className="flex justify-between">
              <span>
                Montage
                {summary.installationTierName ? ` (${summary.installationTierName})` : ""}
              </span>
              <span>{fmt.format(summary.installationGross)}</span>
            </div>
          )}
          {summary.freeMontageDiscount > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Gratis montage</span>
              <span>-{fmt.format(summary.freeMontageDiscount)}</span>
            </div>
          )}
          {summary.discount > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Korting{summary.discountCode ? ` (${summary.discountCode})` : ""}</span>
              <span>-{fmt.format(summary.discount)}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Totaal betaald</span>
            <span className="text-xl font-bold text-gray-900">
              {fmt.format(orderRecord.totalAmount / 100)}
            </span>
          </div>
          {orderRecord.paidAt && (
            <p className="text-xs text-gray-500 mt-1 text-right">
              Betaald op {new Date(orderRecord.paidAt).toLocaleDateString("nl-NL", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          )}
        </div>
      </div>

      {/* CTA links */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/account/orders"
          className="flex-1 text-center py-3 px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          Mijn bestellingen
        </Link>
        <Link
          href="/kledingkast"
          className="flex-1 text-center py-3 px-6 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          Nieuwe kast configureren
        </Link>
      </div>
    </div>
  );
}
