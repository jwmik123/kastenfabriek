CREATE TABLE "sample_request" (
	"id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"material_ids" jsonb NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"street" text NOT NULL,
	"house_number" text NOT NULL,
	"house_number_addition" text,
	"postal_code" text NOT NULL,
	"city" text NOT NULL,
	"country" text DEFAULT 'Nederland' NOT NULL,
	"phone" text,
	"marketing_opt_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp
);
