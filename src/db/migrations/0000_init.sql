CREATE TYPE "public"."reminder_type" AS ENUM('venue_followup', 'rider_due', 'marketing_deadline', 'settlement_due', 'tech_rider_confirm', 'accommodation_booking', 'travel_booking', 'ticket_on_sale', 'custom');--> statement-breakpoint
CREATE TYPE "public"."settlement_type" AS ENUM('guarantee', 'flat_fee', 'split', 'guarantee_vs_split');--> statement-breakpoint
CREATE TYPE "public"."show_status" AS ENUM('planned', 'contacted', 'booked', 'rider_sent', 'confirmed', 'unavailable', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."tour_status" AS ENUM('planning', 'confirmed', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."travel_type" AS ENUM('train', 'car', 'flight', 'tour_bus', 'other');--> statement-breakpoint
CREATE TYPE "public"."venue_type" AS ENUM('comedy_club', 'theatre', 'arena', 'arts_centre', 'pub', 'other');--> statement-breakpoint
CREATE TABLE "accommodations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"show_id" uuid NOT NULL,
	"hotel_name" text,
	"address" text,
	"check_in" date,
	"check_out" date,
	"booking_reference" text,
	"contact_phone" text,
	"cost_pence" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comedians" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"stage_name" text NOT NULL,
	"legal_name" text,
	"phone" text,
	"email" text,
	"address_line1" text,
	"address_line2" text,
	"city" text,
	"postcode" text,
	"country" text,
	"agent_name" text,
	"agent_company" text,
	"agent_phone" text,
	"agent_email" text,
	"manager_name" text,
	"manager_company" text,
	"manager_phone" text,
	"manager_email" text,
	"hospitality_rider" text,
	"technical_rider" text,
	"dressing_room_requirements" text,
	"accessibility_requirements" text,
	"social_instagram" text,
	"social_twitter" text,
	"social_tiktok" text,
	"social_other" text,
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_members" (
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'owner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "org_members_org_user_unique" UNIQUE("org_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organisations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"show_id" uuid,
	"tour_id" uuid,
	"type" "reminder_type" DEFAULT 'custom' NOT NULL,
	"title" text NOT NULL,
	"notes" text,
	"due_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"tour_id" uuid NOT NULL,
	"venue_id" uuid,
	"show_date" date NOT NULL,
	"city" text,
	"show_time" time,
	"doors_time" time,
	"support_act" text,
	"contract_url" text,
	"notes" text,
	"status" "show_status" DEFAULT 'planned' NOT NULL,
	"contacted_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"venue_hire_fee_pence" integer,
	"venue_deposit_pence" integer,
	"venue_deposit_paid" boolean DEFAULT false NOT NULL,
	"settlement_type" "settlement_type",
	"settlement_split_percent" numeric(5, 2),
	"settlement_guarantee_pence" integer,
	"marketing_budget_pence" integer,
	"marketing_copy" text,
	"marketing_notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"show_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price_pence" integer NOT NULL,
	"capacity" integer,
	"sold" integer DEFAULT 0 NOT NULL,
	"comped" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"comedian_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" "tour_status" DEFAULT 'planning' NOT NULL,
	"start_date" date,
	"end_date" date,
	"description" text,
	"marketing_copy" text,
	"press_release" text,
	"photo_assets_notes" text,
	"social_copy_template" text,
	"budget_pence" integer,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "travel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"show_id" uuid NOT NULL,
	"travel_type" "travel_type" DEFAULT 'train' NOT NULL,
	"departure_location" text,
	"departure_at" timestamp with time zone,
	"arrival_location" text,
	"arrival_at" timestamp with time zone,
	"booking_reference" text,
	"cost_pence" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"venue_type" "venue_type" DEFAULT 'comedy_club' NOT NULL,
	"address_line1" text,
	"address_line2" text,
	"city" text,
	"postcode" text,
	"country" text DEFAULT 'United Kingdom',
	"capacity" integer,
	"capacity_notes" text,
	"primary_contact_name" text,
	"primary_contact_role" text,
	"primary_contact_phone" text,
	"primary_contact_email" text,
	"secondary_contact_name" text,
	"secondary_contact_role" text,
	"secondary_contact_phone" text,
	"secondary_contact_email" text,
	"technical_contact_name" text,
	"technical_contact_phone" text,
	"technical_contact_email" text,
	"stage_dimensions" text,
	"load_in_details" text,
	"parking_info" text,
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accommodations" ADD CONSTRAINT "accommodations_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accommodations" ADD CONSTRAINT "accommodations_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comedians" ADD CONSTRAINT "comedians_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shows" ADD CONSTRAINT "shows_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shows" ADD CONSTRAINT "shows_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shows" ADD CONSTRAINT "shows_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_tiers" ADD CONSTRAINT "ticket_tiers_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_tiers" ADD CONSTRAINT "ticket_tiers_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tours" ADD CONSTRAINT "tours_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tours" ADD CONSTRAINT "tours_comedian_id_comedians_id_fk" FOREIGN KEY ("comedian_id") REFERENCES "public"."comedians"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel" ADD CONSTRAINT "travel_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel" ADD CONSTRAINT "travel_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accommodations_show_idx" ON "accommodations" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX "comedians_org_idx" ON "comedians" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "org_members_user_idx" ON "org_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reminders_org_idx" ON "reminders" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "reminders_due_idx" ON "reminders" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "shows_org_idx" ON "shows" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "shows_tour_idx" ON "shows" USING btree ("tour_id");--> statement-breakpoint
CREATE INDEX "shows_date_idx" ON "shows" USING btree ("show_date");--> statement-breakpoint
CREATE INDEX "ticket_tiers_show_idx" ON "ticket_tiers" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX "tours_org_idx" ON "tours" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "tours_comedian_idx" ON "tours" USING btree ("comedian_id");--> statement-breakpoint
CREATE INDEX "travel_show_idx" ON "travel" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX "venues_org_idx" ON "venues" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "venues_city_idx" ON "venues" USING btree ("city");