-- Claude model pricing (#21/#24): mirrors rows produced by the runner's
-- src/pricing.js (mapLitellmPricing). Prices are per-million-tokens.
CREATE TABLE "public"."claude_model_pricing" (
  "model" text PRIMARY KEY,
  "input_per_mtok" numeric NOT NULL,
  "output_per_mtok" numeric NOT NULL,
  "cache_write_per_mtok" numeric,
  "cache_read_per_mtok" numeric,
  "currency" text NOT NULL DEFAULT 'USD',
  "source" text,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
