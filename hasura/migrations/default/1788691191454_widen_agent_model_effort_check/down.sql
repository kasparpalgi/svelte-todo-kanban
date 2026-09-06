ALTER TABLE public.todos
  DROP CONSTRAINT IF EXISTS todos_agent_model_check,
  DROP CONSTRAINT IF EXISTS todos_agent_effort_check,
  ADD CONSTRAINT todos_agent_model_check CHECK (agent_model IS NULL OR agent_model IN ('fable','opus','sonnet','haiku')),
  ADD CONSTRAINT todos_agent_effort_check CHECK (agent_effort IS NULL OR agent_effort IN ('low','medium','high'));
