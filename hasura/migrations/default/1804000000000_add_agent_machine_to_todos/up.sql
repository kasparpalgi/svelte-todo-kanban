ALTER TABLE public.todos
  ADD COLUMN agent_machine text,
  ADD CONSTRAINT todos_agent_machine_check CHECK (
    agent_machine IS NULL OR agent_machine IN ('mac', 'karel')
  );
