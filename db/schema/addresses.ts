import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const address = pgTable("address", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("shipping"), // 'shipping' | 'billing'
  isDefault: boolean("is_default").notNull().default(false),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  company: text("company"),
  street: text("street").notNull(),
  houseNumber: text("house_number").notNull(),
  houseNumberAddition: text("house_number_addition"),
  postalCode: text("postal_code").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull().default("NL"),
  phone: text("phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
