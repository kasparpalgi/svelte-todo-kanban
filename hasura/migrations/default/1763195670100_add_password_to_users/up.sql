-- Add password field to users table for email/password authentication
ALTER TABLE "public"."users" ADD COLUMN "password" TEXT;
