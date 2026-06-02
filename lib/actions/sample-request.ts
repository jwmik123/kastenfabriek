"use server";

import { eq, and } from "drizzle-orm";

import { db } from "@/db";
import { sampleRequest } from "@/db/schema";
import { MATERIALS } from "@/app/(configurator)/kledingkast/materials";
import { sendSampleRequestEmails } from "@/lib/email/resend";

const MAX_SELECTIONS = 3;
const VALID_MATERIAL_IDS = new Set(MATERIALS.map((m) => m.id));

export type SampleRequestInput = {
  materialIds: string[];
  name: string;
  email: string;
  street: string;
  houseNumber: string;
  houseNumberAddition?: string;
  postalCode: string;
  city: string;
  phone?: string;
  marketingOptIn?: boolean;
  // Honeypot — must stay empty (bots fill it).
  company?: string;
};

export type SampleRequestResult =
  | { ok: true }
  | { ok: false; error: string };

function clean(v: string | undefined): string {
  return (v ?? "").trim();
}

export async function createSampleRequest(
  input: SampleRequestInput
): Promise<SampleRequestResult> {
  // Honeypot: silently succeed so bots get no signal, but persist nothing.
  if (clean(input.company)) {
    return { ok: true };
  }

  const materialIds = Array.from(new Set(input.materialIds ?? []));
  if (materialIds.length < 1 || materialIds.length > MAX_SELECTIONS) {
    return { ok: false, error: `Kies 1 tot ${MAX_SELECTIONS} materialen.` };
  }
  if (materialIds.some((id) => !VALID_MATERIAL_IDS.has(id))) {
    return { ok: false, error: "Ongeldig materiaal geselecteerd." };
  }

  const name = clean(input.name);
  const email = clean(input.email).toLowerCase();
  const street = clean(input.street);
  const houseNumber = clean(input.houseNumber);
  const postalCode = clean(input.postalCode);
  const city = clean(input.city);

  if (!name || !street || !houseNumber || !postalCode || !city) {
    return { ok: false, error: "Vul alle verplichte velden in." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Vul een geldig e-mailadres in." };
  }

  // One pending request per email — light abuse guard.
  const existing = await db.query.sampleRequest.findFirst({
    where: and(
      eq(sampleRequest.email, email),
      eq(sampleRequest.status, "pending")
    ),
  });
  if (existing) {
    return {
      ok: false,
      error:
        "Er staat al een aanvraag open op dit e-mailadres. Je stalen zijn onderweg.",
    };
  }

  const houseNumberAddition = clean(input.houseNumberAddition) || null;
  const phone = clean(input.phone) || null;
  const country = "Nederland";

  await db.insert(sampleRequest).values({
    id: crypto.randomUUID(),
    status: "pending",
    materialIds,
    name,
    email,
    street,
    houseNumber,
    houseNumberAddition,
    postalCode,
    city,
    country,
    phone,
    marketingOptIn: Boolean(input.marketingOptIn),
  });

  const shippingAddress = {
    street,
    houseNumber,
    houseNumberAddition,
    postalCode,
    city,
    country,
  };

  // Emails are best-effort — the request is already persisted.
  try {
    await sendSampleRequestEmails({
      customerEmail: email,
      confirmation: { name, materialIds, shippingAddress },
      admin: {
        name,
        email,
        phone,
        materialIds,
        shippingAddress,
        marketingOptIn: Boolean(input.marketingOptIn),
      },
    });
  } catch (err) {
    console.error("Failed to send sample request emails:", err);
  }

  return { ok: true };
}
