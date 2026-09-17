-- Per-user Claude plan (#21/#24): drives effective cost vs API-list cost.
-- null plan / null monthly = API pay-go, effective cost == API-list cost.
ALTER TABLE "public"."users"
  ADD COLUMN IF NOT EXISTS "claude_plan" text,
  ADD COLUMN IF NOT EXISTS "claude_plan_monthly" numeric,
  ADD COLUMN IF NOT EXISTS "claude_plan_currency" text DEFAULT 'EUR';

ALTER TABLE "public"."users"
  DROP CONSTRAINT IF EXISTS "users_claude_plan_check";
ALTER TABLE "public"."users"
  ADD CONSTRAINT "users_claude_plan_check"
  CHECK ("claude_plan" IS NULL OR "claude_plan" IN ('api', 'pro', 'max5x', 'max20x'));
