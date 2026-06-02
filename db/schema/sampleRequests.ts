import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

// Free material-sample requests. Anonymous (no auth) — see lib/actions/sample-request.ts.
export const sampleRequest = pgTable("sample_request", {
  id: text("id").primaryKey(),
  status: text("status").notNull().default("pending"), // pending, sent, cancelled
  // Selected material ids (1-3), e.g. ["zwart", "h1199-thermo-eik"]
  materialIds: jsonb("material_ids").notNull().$type<string[]>(),
  // Contact + shipping (NL only)
  name: text("name").notNull(),
  email: text("email").notNull(),
  street: text("street").notNull(),
  houseNumber: text("house_number").notNull(),
  houseNumberAddition: text("house_number_addition"),
  postalCode: text("postal_code").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull().default("Nederland"),
  phone: text("phone"),
  marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  sentAt: timestamp("sent_at"),
});
