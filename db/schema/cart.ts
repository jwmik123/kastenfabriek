import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const cartItem = pgTable("cart_item", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  configuration: jsonb("configuration").notNull(),
  priceSnapshot: jsonb("price_snapshot").notNull(),
  quantity: integer("quantity").notNull().default(1),
  screenshotClosedUrl: text("screenshot_closed_url"),
  screenshotOpenUrl: text("screenshot_open_url"),
  addedAt: timestamp("added_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
