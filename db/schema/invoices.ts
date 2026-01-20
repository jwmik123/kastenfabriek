import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { order } from "./orders";
import { user } from "./auth";

export const invoice = pgTable("invoice", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  invoiceNumber: text("invoice_number").notNull().unique(),
  status: text("status").notNull().default("draft"), // draft, sent, paid, cancelled
  // Amounts in cents
  subtotal: integer("subtotal").notNull(),
  vatAmount: integer("vat_amount").notNull(),
  vatRate: integer("vat_rate").notNull().default(21), // 21% BTW in Netherlands
  totalAmount: integer("total_amount").notNull(),
  currency: text("currency").notNull().default("EUR"),
  // UBL (Universal Business Language) data for e-invoicing
  ublData: jsonb("ubl_data"),
  // PDF storage path (if generated)
  pdfPath: text("pdf_path"),
  issuedAt: timestamp("issued_at"),
  dueAt: timestamp("due_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
