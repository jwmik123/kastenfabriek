import { getServerSession } from "@/lib/actions/auth";
import { Package, Heart, MapPin } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Mijn Account | Kastenfabriek",
  description: "Beheer je Kastenfabriek account",
};

export default async function AccountPage() {
  const session = await getServerSession();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welkom, {session?.user.name}
        </h1>
        <p className="text-gray-600">
          Beheer je account, bekijk je bestellingen en sla je favoriete
          ontwerpen op.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Link
          href="/account/orders"
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow group"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Bestellingen</h3>
          <p className="text-sm text-gray-600">
            Bekijk je bestelgeschiedenis en volg lopende bestellingen
          </p>
        </Link>

        <Link
          href="/account/wishlist"
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow group"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Verlanglijst</h3>
          <p className="text-sm text-gray-600">
            Sla je favoriete kastontwerpen op om later te bestellen
          </p>
        </Link>

        <Link
          href="/account/addresses"
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow group"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Adressen</h3>
          <p className="text-sm text-gray-600">
            Beheer je verzend- en factuuradressen
          </p>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Accountgegevens</h2>
        <dl className="space-y-3">
          <div className="flex">
            <dt className="w-32 text-gray-500">Naam</dt>
            <dd className="text-gray-900">{session?.user.name}</dd>
          </div>
          <div className="flex">
            <dt className="w-32 text-gray-500">E-mail</dt>
            <dd className="text-gray-900">{session?.user.email}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
