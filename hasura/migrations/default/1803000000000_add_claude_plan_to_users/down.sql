ALTER TABLE "public"."users" DROP CONSTRAINT IF EXISTS "users_claude_plan_check";
ALTER TABLE "public"."users"
  DROP COLUMN IF EXISTS "claude_plan_currency",
  DROP COLUMN IF EXISTS "claude_plan_monthly",
  DROP COLUMN IF EXISTS "claude_plan";
