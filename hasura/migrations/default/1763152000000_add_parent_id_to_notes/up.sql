-- Add parent_id column to notes table for hierarchical subnotes
ALTER TABLE "public"."notes" ADD COLUMN "parent_id" uuid NULL;

-- Add foreign key constraint for parent_id
ALTER TABLE "public"."notes"
  ADD CONSTRAINT "notes_parent_id_fkey"
  FOREIGN KEY ("parent_id")
  REFERENCES "public"."notes"("id")
  ON DELETE CASCADE;

-- Add index for better query performance on parent_id
CREATE INDEX "notes_parent_id_idx" ON "public"."notes" ("parent_id");

-- Add comment for documentation
COMMENT ON COLUMN "public"."notes"."parent_id" IS 'Reference to parent note for hierarchical subnotes structure';
