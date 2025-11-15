-- Remove password field from users table
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "password";
