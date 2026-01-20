import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { address } from "./addresses";

export const order = pgTable("order", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending, paid, processing, shipped, delivered, cancelled
  totalAmount: integer("total_amount").notNull(), // Amount in cents
  currency: text("currency").notNull().default("EUR"),
  shippingAddressId: text("shipping_address_id").references(() => address.id),
  billingAddressId: text("billing_address_id").references(() => address.id),
  // Snapshot of addresses at time of order (in case user deletes address)
  shippingAddressSnapshot: jsonb("shipping_address_snapshot"),
  billingAddressSnapshot: jsonb("billing_address_snapshot"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
});

export const orderItem = pgTable("order_item", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),
  sanityProductId: text("sanity_product_id").notNull(), // Reference to Sanity product
  productName: text("product_name").notNull(), // Snapshot of product name
  // Full configuration snapshot at time of order
  configurationSnapshot: jsonb("configuration_snapshot").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(), // Price in cents
  totalPrice: integer("total_price").notNull(), // Price in cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
