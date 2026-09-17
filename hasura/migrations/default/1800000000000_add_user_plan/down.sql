ALTER TABLE "public"."users" DROP CONSTRAINT IF EXISTS "users_plan_check";
ALTER TABLE "public"."users"
  DROP COLUMN IF EXISTS "stripe_customer_id",
  DROP COLUMN IF EXISTS "plan_expires_at",
  DROP COLUMN IF EXISTS "plan";
