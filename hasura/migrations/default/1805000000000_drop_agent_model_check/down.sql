ALTER TABLE public.todos
  ADD CONSTRAINT todos_agent_model_check CHECK (
    agent_model IS NULL OR agent_model IN (
      'fable', 'opus', 'sonnet', 'haiku',
      'fable-5.1',
      'opus-5.5', 'opus-5', 'opus-4.8', 'opus-4.6',
      'sonnet-5', 'sonnet-4.6',
      'haiku-4.5'
    )
  );
