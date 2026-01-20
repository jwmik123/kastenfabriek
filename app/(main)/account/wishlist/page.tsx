import { getWishlists } from "@/lib/actions/wishlist";
import { Heart } from "lucide-react";

export const metadata = {
  title: "Verlanglijst | Kastenfabriek",
  description: "Bekijk je opgeslagen ontwerpen",
};

export default async function WishlistPage() {
  const wishlists = await getWishlists();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verlanglijst</h1>
        <p className="text-gray-600">
          Sla je favoriete kastontwerpen op en bestel ze wanneer je klaar bent.
        </p>
      </div>

      {wishlists.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Je verlanglijst is leeg
          </h3>
          <p className="text-gray-600 mb-6">
            Sla je favoriete ontwerpen op door op het hartje te klikken in de
            configurator.
          </p>
          <a
            href="/"
            className="inline-flex px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Start met configureren
          </a>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {wishlists.map((list) => (
            <div key={list.id} className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{list.name}</h3>
              <p className="text-sm text-gray-500 mb-4">
                Aangemaakt op{" "}
                {new Date(list.createdAt).toLocaleDateString("nl-NL")}
              </p>
              <a
                href={`/account/wishlist/${list.id}`}
                className="text-primary hover:text-primary-dark font-medium"
              >
                Bekijk ontwerpen
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
