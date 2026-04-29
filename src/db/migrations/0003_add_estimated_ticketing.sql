-- Add 'completed' to the show_status enum
ALTER TYPE "show_status" ADD VALUE IF NOT EXISTS 'completed';--> statement-breakpoint

-- Estimated ticketing (pre-show planning)
ALTER TABLE "shows" ADD COLUMN IF NOT EXISTS "est_tickets_sold" integer;--> statement-breakpoint
ALTER TABLE "shows" ADD COLUMN IF NOT EXISTS "est_tickets_sold_pct" numeric(5, 2);--> statement-breakpoint

-- Actual ticketing (post-show reconciliation — revenue is manually entered)
ALTER TABLE "shows" ADD COLUMN IF NOT EXISTS "actual_revenue_pence" integer;--> statement-breakpoint
ALTER TABLE "shows" ADD COLUMN IF NOT EXISTS "actual_ticket_price_pence" integer;
