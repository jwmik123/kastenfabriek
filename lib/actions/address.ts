"use server";

import { db } from "@/db";
import { address } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

export type AddressInput = {
  type?: "shipping" | "billing";
  isDefault?: boolean;
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  houseNumber: string;
  houseNumberAddition?: string;
  postalCode: string;
  city: string;
  country?: string;
  phone?: string;
};

export async function getAddresses() {
  const user = await getCurrentUser();
  if (!user) return [];

  return db.query.address.findMany({
    where: eq(address.userId, user.id),
    orderBy: (address, { desc }) => [desc(address.isDefault)],
  });
}

export async function createAddress(data: AddressInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  // If this is set as default, unset other defaults of same type
  if (data.isDefault) {
    await db
      .update(address)
      .set({ isDefault: false })
      .where(
        and(
          eq(address.userId, user.id),
          eq(address.type, data.type || "shipping")
        )
      );
  }

  const id = crypto.randomUUID();
  await db.insert(address).values({
    id,
    userId: user.id,
    type: data.type || "shipping",
    isDefault: data.isDefault || false,
    firstName: data.firstName,
    lastName: data.lastName,
    company: data.company,
    street: data.street,
    houseNumber: data.houseNumber,
    houseNumberAddition: data.houseNumberAddition,
    postalCode: data.postalCode,
    city: data.city,
    country: data.country || "NL",
    phone: data.phone,
  });

  revalidatePath("/account");
  return { id };
}

export async function updateAddress(addressId: string, data: AddressInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  // If this is set as default, unset other defaults of same type
  if (data.isDefault) {
    await db
      .update(address)
      .set({ isDefault: false })
      .where(
        and(
          eq(address.userId, user.id),
          eq(address.type, data.type || "shipping")
        )
      );
  }

  await db
    .update(address)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(address.id, addressId), eq(address.userId, user.id)));

  revalidatePath("/account");
}

export async function deleteAddress(addressId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  await db
    .delete(address)
    .where(and(eq(address.id, addressId), eq(address.userId, user.id)));
  revalidatePath("/account");
}
