ALTER TABLE public.todos
  DROP CONSTRAINT IF EXISTS todos_agent_model_check,
  DROP CONSTRAINT IF EXISTS todos_agent_effort_check,
  DROP COLUMN IF EXISTS agent_model,
  DROP COLUMN IF EXISTS agent_effort;