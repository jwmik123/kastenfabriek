"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { Check, Loader2 } from "lucide-react";

import {
  MATERIALS,
  type ColorMaterial,
  type TextureMaterial,
} from "@/app/(configurator)/kledingkast/materials";
import { createSampleRequest } from "@/lib/actions/sample-request";
import type { Product } from "@/sanity/lib/products";

const textures = MATERIALS.filter(
  (m): m is TextureMaterial => m.type === "texture"
);
const colors = MATERIALS.filter((m): m is ColorMaterial => m.type === "color");

export default function SampleConfigurator({ product }: { product: Product }) {
  const maxSelections = product.sampleConfig?.maxSelections ?? 3;

  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function toggle(id: string) {
    setError(null);
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= maxSelections) return prev;
      return [...prev, id];
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selected.length < 1) {
      setError(`Kies minimaal 1 en maximaal ${maxSelections} materialen.`);
      return;
    }
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    setError(null);
    const res = await createSampleRequest({
      materialIds: selected,
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      street: String(fd.get("street") ?? ""),
      houseNumber: String(fd.get("houseNumber") ?? ""),
      houseNumberAddition: String(fd.get("houseNumberAddition") ?? ""),
      postalCode: String(fd.get("postalCode") ?? ""),
      city: String(fd.get("city") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      marketingOptIn: fd.get("marketingOptIn") === "on",
      company: String(fd.get("company") ?? ""), // honeypot
    });
    setSubmitting(false);
    if (res.ok) setDone(true);
    else setError(res.error);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-secondary)]/15">
          <Check className="h-7 w-7 text-[var(--color-secondary)]" />
        </div>
        <h2 className="mb-2 text-2xl font-semibold text-gray-900">
          Aanvraag ontvangen!
        </h2>
        <p className="mb-6 text-gray-600">
          Je gratis materiaalstalen worden binnen drie werkdagen verzonden. We
          hebben een bevestiging naar je e-mailadres gestuurd.
        </p>
        <Link
          href="/"
          className="inline-block rounded-full bg-[var(--color-secondary)] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Terug naar home
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
      {/* Left: intro + material picker */}
      <div>
        <h1 className="mb-3 text-4xl font-semibold text-gray-900">
          {product.title}
        </h1>
        <p className="mb-6 text-lg text-gray-600">{product.shortDescription}</p>
        {product.longDescription && (
          <div className="prose prose-sm mb-10 max-w-none text-gray-700">
            <PortableText value={product.longDescription} />
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Kies je stalen
          </h2>
          <span className="text-sm text-gray-500">
            {selected.length}/{maxSelections} gekozen
          </span>
        </div>

        <p className="mb-2 text-sm font-medium text-gray-700">Fineers</p>
        <div className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {textures.map((m) => (
            <SwatchTile
              key={m.id}
              label={m.name}
              selected={selected.includes(m.id)}
              disabled={
                !selected.includes(m.id) && selected.length >= maxSelections
              }
              onClick={() => toggle(m.id)}
            >
              <Image
                src={m.preview.replace(/\.webp$/, ".jpg")}
                alt={m.name}
                fill
                className="object-cover"
                sizes="160px"
              />
            </SwatchTile>
          ))}
        </div>

        <p className="mb-2 text-sm font-medium text-gray-700">Kleuren</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {colors.map((m) => (
            <SwatchTile
              key={m.id}
              label={m.name}
              selected={selected.includes(m.id)}
              disabled={
                !selected.includes(m.id) && selected.length >= maxSelections
              }
              onClick={() => toggle(m.id)}
            >
              <span
                className="block h-full w-full"
                style={{ backgroundColor: m.color }}
              />
            </SwatchTile>
          ))}
        </div>
      </div>

      {/* Right: order form */}
      <form
        onSubmit={onSubmit}
        className="h-fit rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-28"
      >
        <h2 className="mb-1 text-lg font-semibold text-gray-900">
          Gratis thuisbezorgd
        </h2>
        <p className="mb-5 text-sm text-gray-500">
          Geen verzendkosten. Alleen bezorging binnen Nederland.
        </p>

        {/* Honeypot — hidden from users */}
        <div aria-hidden className="hidden">
          <label>
            Bedrijf
            <input type="text" name="company" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div className="space-y-3">
          <Field name="name" label="Naam" required />
          <Field name="email" label="E-mail" type="email" required />
          <div className="grid grid-cols-[1fr_90px_90px] gap-2">
            <Field name="street" label="Straat" required />
            <Field name="houseNumber" label="Nr." required />
            <Field name="houseNumberAddition" label="Toev." />
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2">
            <Field name="postalCode" label="Postcode" required />
            <Field name="city" label="Plaats" required />
          </div>
          <Field name="phone" label="Telefoon (optioneel)" type="tel" />
        </div>

        <label className="mt-4 flex items-start gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            name="marketingOptIn"
            className="mt-0.5 h-4 w-4 rounded border-gray-300"
          />
          <span>Houd me op de hoogte van nieuws en aanbiedingen.</span>
        </label>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-secondary)] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Versturen…" : "Bestel gratis stalen"}
        </button>
      </form>
    </div>
  );
}

function SwatchTile({
  label,
  selected,
  disabled,
  onClick,
  children,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-pressed={selected}
      className={`group flex flex-col gap-1.5 text-left transition disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <span
        className={`relative aspect-square w-full overflow-hidden rounded-md ring-2 transition ${
          selected
            ? "ring-[var(--color-secondary)]"
            : "ring-transparent group-hover:ring-black/10"
        }`}
      >
        {children}
        {selected && (
          <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-secondary)] text-white">
            <Check className="h-3 w-3" />
          </span>
        )}
      </span>
      <span className="text-xs font-medium leading-tight text-gray-700">
        {label}
      </span>
    </button>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-secondary)] focus:ring-1 focus:ring-[var(--color-secondary)]"
      />
    </label>
  );
}
