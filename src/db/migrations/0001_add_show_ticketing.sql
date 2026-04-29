ALTER TABLE "shows" ADD COLUMN "ticket_price_pence" integer;--> statement-breakpoint
ALTER TABLE "shows" ADD COLUMN "ticket_capacity" integer;--> statement-breakpoint
ALTER TABLE "shows" ADD COLUMN "tickets_sold" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "shows" ADD COLUMN "tickets_comped" integer DEFAULT 0 NOT NULL;