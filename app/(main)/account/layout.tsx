import Link from "next/link";
import { getServerSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { User, Heart, Package, MapPin, LogOut } from "lucide-react";

const navItems = [
  { href: "/account", label: "Overzicht", icon: User },
  { href: "/account/orders", label: "Bestellingen", icon: Package },
  { href: "/account/wishlist", label: "Verlanglijst", icon: Heart },
  { href: "/account/addresses", label: "Adressen", icon: MapPin },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login?callbackUrl=/account");
  }

  return (
    <div className="bg-primary-200 py-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-500">Welkom,</p>
                <p className="font-semibold text-gray-900">
                  {session.user.name}
                </p>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}

                <form action="/api/auth/sign-out" method="POST">
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Uitloggen</span>
                  </button>
                </form>
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
