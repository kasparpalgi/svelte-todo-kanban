-- #229: one stamp per board that every card, comment, label and list write bumps (in the
-- server ops). The 30 s poll compares it instead of fingerprinting every card, which read
-- ~1,500 rows per poll on a 334-card board (D1 Free allows 5M reads a day).
ALTER TABLE public.boards ADD COLUMN IF NOT EXISTS changed_at timestamptz NOT NULL DEFAULT now();
