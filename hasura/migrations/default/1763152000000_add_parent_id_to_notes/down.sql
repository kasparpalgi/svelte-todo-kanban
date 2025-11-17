-- Remove index
DROP INDEX IF EXISTS "public"."notes_parent_id_idx";

-- Remove foreign key constraint
ALTER TABLE "public"."notes" DROP CONSTRAINT IF EXISTS "notes_parent_id_fkey";

-- Remove parent_id column
ALTER TABLE "public"."notes" DROP COLUMN IF EXISTS "parent_id";
