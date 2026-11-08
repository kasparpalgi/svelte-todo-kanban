-- A card that wants its plan approved before any code is written (svelte-hasura-boilerplate#70).
ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS agent_plan_first boolean NOT NULL DEFAULT false;
