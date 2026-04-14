"use server";

import { auth } from "@/utils/auth";
import { headers } from "next/headers";

export async function getServerSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user ?? null;
}
