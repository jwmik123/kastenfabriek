TRUNCATE "wishlist_item";--> statement-breakpoint
ALTER TABLE "wishlist" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "wishlist" CASCADE;--> statement-breakpoint
ALTER TABLE "wishlist_item" DROP CONSTRAINT "wishlist_item_wishlist_id_wishlist_id_fk";
--> statement-breakpoint
ALTER TABLE "wishlist_item" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "wishlist_item" ADD COLUMN "kind" text DEFAULT 'closet' NOT NULL;--> statement-breakpoint
ALTER TABLE "wishlist_item" ADD COLUMN "configuration" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "wishlist_item" ADD COLUMN "price_snapshot" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "wishlist_item" ADD COLUMN "screenshot_closed_url" text;--> statement-breakpoint
ALTER TABLE "wishlist_item" ADD COLUMN "screenshot_open_url" text;--> statement-breakpoint
ALTER TABLE "wishlist_item" ADD COLUMN "added_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "wishlist_item" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "wishlist_item" ADD CONSTRAINT "wishlist_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_item" DROP COLUMN "wishlist_id";--> statement-breakpoint
ALTER TABLE "wishlist_item" DROP COLUMN "sanity_product_id";--> statement-breakpoint
ALTER TABLE "wishlist_item" DROP COLUMN "product_name";--> statement-breakpoint
ALTER TABLE "wishlist_item" DROP COLUMN "configuration_snapshot";--> statement-breakpoint
ALTER TABLE "wishlist_item" DROP COLUMN "calculated_price";--> statement-breakpoint
ALTER TABLE "wishlist_item" DROP COLUMN "created_at";