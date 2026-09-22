import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Showroom visits booked through the homepage calendar. Anonymous (no auth).
 * `date` and `startTime` are the showroom's wall clock ('YYYY-MM-DD', 'HH:mm'),
 * never UTC instants — see lib/showroom/availability.ts.
 *
 * Capacity is enforced inside the booking transaction under a per-slot
 * advisory lock (lib/actions/showroom-appointment.ts), so two customers cannot
 * both take the last place in a slot.
 */
export const showroomAppointment = pgTable(
  "showroom_appointment",
  {
    id: text("id").primaryKey(),
    status: text("status").notNull().default("confirmed"), // confirmed, cancelled
    date: text("date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    cancelledAt: timestamp("cancelled_at"),
  },
  (t) => [index("showroom_appointment_slot_idx").on(t.date, t.startTime)],
);
