import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const wishlist = pgTable("wishlist", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Mijn verlanglijst"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const wishlistItem = pgTable("wishlist_item", {
  id: text("id").primaryKey(),
  wishlistId: text("wishlist_id")
    .notNull()
    .references(() => wishlist.id, { onDelete: "cascade" }),
  sanityProductId: text("sanity_product_id").notNull(),
  productName: text("product_name").notNull(),
  // Saved configuration for the 3D configurator
  configurationSnapshot: jsonb("configuration_snapshot").notNull(),
  // Calculated price at time of saving
  calculatedPrice: text("calculated_price"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
