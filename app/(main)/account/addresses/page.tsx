import { getAddresses } from "@/lib/actions/address";
import { MapPin, Plus } from "lucide-react";

export const metadata = {
  title: "Adressen | Kastenfabriek",
  description: "Beheer je adressen",
};

export default async function AddressesPage() {
  const addresses = await getAddresses();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Adressen</h1>
          <p className="text-gray-600">
            Beheer je verzend- en factuuradressen.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
          <Plus className="w-5 h-5" />
          <span>Nieuw adres</span>
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nog geen adressen
          </h3>
          <p className="text-gray-600 mb-6">
            Voeg een adres toe om sneller af te rekenen bij je volgende
            bestelling.
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
            <Plus className="w-5 h-5" />
            <span>Adres toevoegen</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      addr.type === "shipping"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {addr.type === "shipping" ? "Verzending" : "Factuur"}
                  </span>
                  {addr.isDefault && (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                      Standaard
                    </span>
                  )}
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  Bewerken
                </button>
              </div>
              <div className="text-gray-700">
                <p className="font-medium">
                  {addr.firstName} {addr.lastName}
                </p>
                {addr.company && (
                  <p className="text-gray-500">{addr.company}</p>
                )}
                <p>
                  {addr.street} {addr.houseNumber}
                  {addr.houseNumberAddition}
                </p>
                <p>
                  {addr.postalCode} {addr.city}
                </p>
                <p>{addr.country}</p>
                {addr.phone && (
                  <p className="mt-2 text-gray-500">{addr.phone}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
