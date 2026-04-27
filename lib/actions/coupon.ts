"use server";

import { groq } from "next-sanity";
import { client, writeClient } from "@/sanity/lib/client";

type CouponDiscount = {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
};

export type ValidateCouponResult =
  | { valid: true; discount: CouponDiscount }
  | { valid: false; error: "not_found" | "expired" | "limit_reached" };

type SanityCoupon = {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  expiresAt: string;
  maxUses: number;
  currentUses: number;
};

const couponByCodeQuery = groq`
  *[_type == "coupon" && code == $code][0] {
    code,
    discountType,
    discountValue,
    expiresAt,
    maxUses,
    currentUses
  }
`;

const couponIdByCodeQuery = groq`*[_type == "coupon" && code == $code][0] { _id }`;

export async function incrementCouponUseCount(code: string): Promise<void> {
  const doc = await writeClient.fetch<{ _id: string } | null>(couponIdByCodeQuery, { code });
  if (!doc) return;
  await writeClient.patch(doc._id).inc({ currentUses: 1 }).commit();
}

export async function validateCoupon(
  rawCode: string
): Promise<ValidateCouponResult> {
  const code = rawCode.trim().toUpperCase();

  const coupon = await client.fetch<SanityCoupon | null>(couponByCodeQuery, {
    code,
  });

  if (!coupon) return { valid: false, error: "not_found" };

  if (new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, error: "expired" };
  }

  if (coupon.currentUses >= coupon.maxUses) {
    return { valid: false, error: "limit_reached" };
  }

  return {
    valid: true,
    discount: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    },
  };
}
