ALTER TABLE public.todos
  DROP CONSTRAINT IF EXISTS todos_agent_model_check,
  DROP CONSTRAINT IF EXISTS todos_agent_effort_check,
  ADD CONSTRAINT todos_agent_model_check CHECK (
    agent_model IS NULL OR agent_model IN (
      'fable', 'opus', 'sonnet', 'haiku',
      'fable-5.1',
      'opus-5', 'opus-4.8', 'opus-4.6',
      'sonnet-5', 'sonnet-4.6',
      'haiku-4.5'
    )
  ),
  ADD CONSTRAINT todos_agent_effort_check CHECK (
    agent_effort IS NULL OR agent_effort IN ('low', 'medium', 'high', 'xhigh', 'max')
  );
