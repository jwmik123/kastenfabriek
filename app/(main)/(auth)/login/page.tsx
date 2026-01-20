import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { GoogleButton } from "@/components/auth/GoogleButton";

export const metadata = {
  title: "Inloggen | Kastenfabriek",
  description: "Log in op je Kastenfabriek account",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Welkom terug</h2>
        <p className="text-gray-600 mt-2">Log in op je account</p>
      </div>

      <GoogleButton callbackUrl={callbackUrl} />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">of</span>
        </div>
      </div>

      <LoginForm callbackUrl={callbackUrl} />

      <p className="text-center text-sm text-gray-600 mt-6">
        Nog geen account?{" "}
        <Link
          href={`/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="text-primary hover:text-primary-dark font-medium"
        >
          Registreer hier
        </Link>
      </p>
    </div>
  );
}
