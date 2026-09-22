CREATE TABLE "showroom_appointment" (
	"id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"cancelled_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "showroom_appointment_slot_idx" ON "showroom_appointment" USING btree ("date","start_time");