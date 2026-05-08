ALTER TABLE "cart_item" ADD COLUMN "kind" text DEFAULT 'closet' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_item" ADD COLUMN "kind" text DEFAULT 'closet' NOT NULL;