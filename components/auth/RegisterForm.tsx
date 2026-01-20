"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";

export function RegisterForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen");
      return;
    }

    if (password.length < 8) {
      setError("Wachtwoord moet minimaal 8 tekens zijn");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp.email({
        name,
        email,
        password,
        callbackURL: callbackUrl || "/account",
      });

      if (result.error) {
        setError(result.error.message || "Registratie mislukt");
        setIsLoading(false);
      } else {
        router.push(callbackUrl || "/account");
        router.refresh();
      }
    } catch {
      setError("Er is iets misgegaan. Probeer het opnieuw.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Volledige naam
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          placeholder="Jan de Vries"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          E-mailadres
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          placeholder="naam@voorbeeld.nl"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Wachtwoord
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          placeholder="Minimaal 8 tekens"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Bevestig wachtwoord
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          placeholder="Herhaal wachtwoord"
        />
      </div>

      <div className="text-sm text-gray-600">
        <label className="flex items-start gap-2">
          <input type="checkbox" required className="rounded mt-1" />
          <span>
            Ik ga akkoord met de{" "}
            <a href="/voorwaarden" className="text-primary hover:underline">
              algemene voorwaarden
            </a>{" "}
            en het{" "}
            <a href="/privacy" className="text-primary hover:underline">
              privacybeleid
            </a>
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 font-medium"
      >
        {isLoading ? "Account aanmaken..." : "Account aanmaken"}
      </button>
    </form>
  );
}
