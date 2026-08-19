import { getOrders } from "@/lib/actions/order";
import { Package } from "lucide-react";

export const metadata = {
  title: "Bestellingen",
  description: "Bekijk je bestelgeschiedenis",
};

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bestellingen</h1>
        <p className="text-gray-600">
          Bekijk je bestelgeschiedenis en volg lopende bestellingen.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nog geen bestellingen
          </h3>
          <p className="text-gray-600 mb-6">
            Je hebt nog geen bestellingen geplaatst. Start met het configureren
            van je droomkast!
          </p>
          <a
            href="/"
            className="inline-flex px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Start met configureren
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-900">
                    {order.orderNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("nl-NL", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === "delivered"
                      ? "bg-green-100 text-green-700"
                      : order.status === "shipped"
                        ? "bg-blue-100 text-blue-700"
                        : order.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {order.status === "pending" && "In behandeling"}
                  {order.status === "paid" && "Betaald"}
                  {order.status === "processing" && "In productie"}
                  {order.status === "shipped" && "Verzonden"}
                  {order.status === "delivered" && "Geleverd"}
                  {order.status === "cancelled" && "Geannuleerd"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  Totaal:{" "}
                  <span className="font-semibold text-gray-900">
                    {new Intl.NumberFormat("nl-NL", {
                      style: "currency",
                      currency: order.currency,
                    }).format(order.totalAmount / 100)}
                  </span>
                </p>
                <a
                  href={`/account/orders/${order.id}`}
                  className="text-primary hover:text-primary-dark font-medium"
                >
                  Details bekijken
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
