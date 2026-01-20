import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const review = pgTable("review", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  sanityProductId: text("sanity_product_id").notNull(),
  orderId: text("order_id"), // Optional link to order
  rating: integer("rating").notNull(), // 1-5
  title: text("title"),
  content: text("content"),
  isVerifiedPurchase: integer("is_verified_purchase").notNull().default(0),
  isApproved: integer("is_approved").notNull().default(0), // For moderation
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
