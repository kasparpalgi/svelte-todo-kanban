ALTER TABLE public.todos
  DROP CONSTRAINT IF EXISTS todos_agent_machine_check,
  DROP COLUMN IF EXISTS agent_machine;
