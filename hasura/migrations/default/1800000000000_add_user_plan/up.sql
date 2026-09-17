-- Paid plan support (#194): plan tier + Stripe linkage on users.
-- Additive and non-destructive. `plan` defaults to 'free' for every existing user.
ALTER TABLE "public"."users"
  ADD COLUMN IF NOT EXISTS "plan" text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS "plan_expires_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;

-- Guard the tier values so only the Stripe webhook writes a known plan.
ALTER TABLE "public"."users"
  DROP CONSTRAINT IF EXISTS "users_plan_check";
ALTER TABLE "public"."users"
  ADD CONSTRAINT "users_plan_check" CHECK ("plan" IN ('free', 'paid'));
