import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth";

// Mirrors cart_item so wishlist lines can move to the cart without conversion.
// One implicit wishlist per user (no separate wishlist container table).
export const wishlistItem = pgTable("wishlist_item", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("closet"),
  configuration: jsonb("configuration").notNull(),
  priceSnapshot: jsonb("price_snapshot").notNull(),
  screenshotClosedUrl: text("screenshot_closed_url"),
  screenshotOpenUrl: text("screenshot_open_url"),
  addedAt: timestamp("added_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
